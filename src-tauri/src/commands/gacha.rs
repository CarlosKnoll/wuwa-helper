use crate::db::init_db;
use rusqlite::{Result, params};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct PityStatus {
    pub banner_type: String,
    pub current_pity_5star: i64,
    pub current_pity_4star: i64,
    pub guaranteed_next_fivestar: bool,
    pub total_pulls: i64,
    pub last_5star_pull: Option<i64>,
    pub last_4star_pull: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PullHistory {
    pub id: i64,
    pub banner_type: String,
    pub pull_number: i64,
    pub item_name: String,
    pub rarity: i64,
    pub item_type: String,
    pub is_guaranteed: bool,
    pub pull_date: String,
    pub notes: Option<String>,
    pub group_order: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
struct GameApiResponse {
    code: i32,
    message: String,
    data: Option<Vec<GamePullRecord>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GamePullRecord {
    card_pool_type: String,
    resource_id: i64,
    resource_type: String,
    name: String,
    quality_level: i64,
    time: String,
    count: i64,
}

#[tauri::command]
pub fn get_pull_history(app: tauri::AppHandle) -> Result<Vec<PullHistory>, String> {
    let conn = init_db(&app)?;

    let mut stmt = conn.prepare(
        "SELECT id, banner_type, pull_number, item_name, rarity, item_type, is_guaranteed, pull_date, notes, group_order
         FROM pull_history
         ORDER BY pull_date DESC, COALESCE(group_order, 0) DESC, id DESC",
    ).map_err(|e| e.to_string())?;

    let pulls = stmt.query_map([], |row| {
        Ok(PullHistory {
            id: row.get(0)?,
            banner_type: row.get(1)?,
            pull_number: row.get(2)?,
            item_name: row.get(3)?,
            rarity: row.get(4)?,
            item_type: row.get(5)?,
            is_guaranteed: row.get(6)?,
            pull_date: row.get(7)?,
            notes: row.get(8)?,
            group_order: row.get(9)?,
        })
    })
    .map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())?;

    Ok(pulls)
}

#[tauri::command]
pub fn get_pull_count(
    app: tauri::AppHandle,
    banner_type: String,
    item_name: String,
    pull_date: String,
) -> Result<i64, String> {
    let conn = init_db(&app)?;

    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM pull_history
         WHERE banner_type = ? AND item_name = ? AND pull_date = ?",
        params![banner_type, item_name, pull_date],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    Ok(count)
}

#[tauri::command]
pub fn check_pull_exists(
    app: tauri::AppHandle,
    banner_type: String,
    item_name: String,
    pull_date: String,
) -> Result<bool, String> {
    let conn = init_db(&app)?;

    let exists: bool = conn.query_row(
        "SELECT EXISTS(
            SELECT 1 FROM pull_history
            WHERE banner_type = ? AND item_name = ? AND pull_date = ?
        )",
        params![banner_type, item_name, pull_date],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    Ok(exists)
}

#[tauri::command]
pub fn add_pull(
    app: tauri::AppHandle,
    banner_type: String,
    item_name: String,
    rarity: i64,
    item_type: String,
    is_guaranteed: bool,
    pull_date: String,
    notes: Option<String>,
    group_order: Option<i64>,
) -> Result<String, String> {
    let conn = init_db(&app)?;

    // Wrap in a transaction so the MAX query and INSERT are atomic.
    // Without this, concurrent connections can read the same MAX and
    // both try to insert the same pull_number.
    conn.execute_batch("BEGIN IMMEDIATE").map_err(|e| e.to_string())?;

    let pull_number: i64 = conn.query_row(
        "SELECT COALESCE(MAX(pull_number), 0) FROM pull_history WHERE banner_type = ?",
        params![banner_type],
        |row| row.get(0),
    ).unwrap_or(0) + 1;

    let result = conn.execute(
        "INSERT INTO pull_history
        (banner_type, pull_number, item_name, rarity, item_type, is_guaranteed, pull_date, notes, group_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            banner_type,
            pull_number,
            item_name,
            rarity,
            item_type,
            is_guaranteed,
            pull_date,
            notes,
            group_order
        ],
    );

    match result {
        Ok(_) => {
            conn.execute_batch("COMMIT").map_err(|e| e.to_string())?;
            Ok("Pull added".into())
        }
        Err(e) => {
            let _ = conn.execute_batch("ROLLBACK");
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub fn delete_pull(app: tauri::AppHandle, id: i64) -> Result<String, String> {
    let conn = init_db(&app)?;
    conn.execute("DELETE FROM pull_history WHERE id = ?", params![id])
        .map_err(|e| e.to_string())?;
    Ok("Pull deleted".into())
}

#[tauri::command]
pub async fn import_pulls_from_url(app: tauri::AppHandle, url: String) -> Result<String, String> {
    
    let hash = url.split('#').nth(1).ok_or("Invalid URL")?;
    let query = hash.split('?').nth(1).ok_or("Invalid URL")?;

    let params: std::collections::HashMap<_, _> = query
        .split('&')
        .filter_map(|p| p.split_once('='))
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect();

    let player_id = params["player_id"].clone();
    let svr_id = params["svr_id"].clone();
    let record_id = params["record_id"].clone();
    let lang = params.get("lang").cloned().unwrap_or_else(|| "en".into());

    let api = if url.contains("aki-game.net") {
        "https://gmserver-api.aki-game2.net/gacha/record/query"
    } else {
        "https://gmserver-api.aki-game2.com/gacha/record/query"
    };


    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))  // 30 second timeout per request
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;
    let conn = init_db(&app)?;

    let mut imported = 0;
    let mut fetched = 0;

    for pool in ["1", "2", "3", "4"] {
        
        let banner = match map_card_pool_to_banner(pool) {
            Some(b) => b,
            None => {
                continue;
            }
        };

        eprintln!("[INFO] Processing banner: {} (pool {})", banner, pool);
        let mut page = 1;

        loop {
            let body = serde_json::json!({
                "playerId": player_id,
                "serverId": svr_id,
                "languageCode": lang,
                "cardPoolType": pool,
                "recordId": record_id,
                "pageIndex": page,
                "pageSize": 20
            });

            let res: GameApiResponse = client.post(api)
                .json(&body)
                .send().await
                .map_err(|e| {
                    let err = format!("HTTP request failed: {}", e);
                    eprintln!("[ERROR] {}", err);
                    err
                })?
                .json().await
                .map_err(|e| {
                    let err = format!("JSON parse failed: {}", e);
                    eprintln!("[ERROR] {}", err);
                    err
                })?;

            let records = match res.data {
                Some(r) if !r.is_empty() => {
                    eprintln!("[INFO] Banner {} page {}: Got {} records", banner, page, r.len());
                    r
                },
                Some(_r) => {
                    eprintln!("[INFO] Banner {} page {}: Empty response, moving to next banner", banner, page);
                    break;
                },
                None => {
                    eprintln!("[INFO] Banner {} page {}: No data, moving to next banner", banner, page);
                    break;
                }
            };

            fetched += records.len();

            let mut new_pulls_on_this_page = 0;
            
            // First pass: group records by timestamp to identify multi-pulls
            let mut timestamp_groups: std::collections::HashMap<String, Vec<GamePullRecord>> = 
                std::collections::HashMap::new();
            
            for r in records {
                let normalized_date = normalize_date_format(&r.time);
                timestamp_groups.entry(normalized_date).or_insert_with(Vec::new).push(r);
            }

            // Second pass: process each timestamp group
            for (normalized_date, mut group_records) in timestamp_groups {
                let is_multi_pull = group_records.len() > 1;
                
                // For multi-pulls: assign group_order from 10 down to 1 (newest to oldest)
                // For single pulls: assign group_order = 1
                for (index, r) in group_records.iter().enumerate() {
                    let item_type = if r.resource_type == "Resonator" {
                        "character"
                    } else {
                        "weapon"
                    };

                    let group_order = if is_multi_pull {
                        // Multi-pull: first item (index 0) gets 10, second gets 9, etc.
                        // But we need to handle cases where there might be less than 10 items
                        let total_in_group = group_records.len() as i64;
                        total_in_group - (index as i64)
                    } else {
                        // Single pull: always 1
                        1
                    };

                    // Check if this exact pull already exists
                    let already_exists: bool = conn.query_row(
                        "SELECT EXISTS(
                            SELECT 1 FROM pull_history
                            WHERE banner_type = ? 
                            AND item_name = ?
                            AND pull_date = ?
                            AND group_order = ?
                        )",
                        params![banner, r.name, normalized_date, group_order],
                        |row| row.get(0),
                    ).unwrap_or(false);

                    if already_exists {
                        eprintln!("[INFO] Found existing pull, skipping: {} at {} (group_order {})", 
                                  r.name, normalized_date, group_order);
                        continue;
                    }

                    // Add the pull
                    add_pull(
                        app.clone(),
                        banner.clone(),
                        r.name.clone(),
                        r.quality_level,
                        item_type.into(),
                        false,
                        normalized_date.clone(),
                        Some("Imported from game URL".into()),
                        Some(group_order),
                    )?;

                    imported += 1;
                    new_pulls_on_this_page += 1;
                    
                    eprintln!("[INFO] Imported: {} at {} (group_order {})", 
                              r.name, normalized_date, group_order);
                }
            }

            // If we didn't import ANY new pulls from this entire page,
            // that means all records were duplicates and we've reached the end
            // (the API keeps returning the same page or old data)
            if new_pulls_on_this_page == 0 {
                eprintln!("[INFO] Banner {} page {}: All records were duplicates, stopping pagination", banner, page);
                break;
            }

            page += 1;
        }
    }

    let result = format!(
        "Successfully imported {} new pulls (fetched {} total)",
        imported, fetched
    );
    
    eprintln!("[INFO] Import complete: {}", result);
    
    Ok(result)
}

fn map_card_pool_to_banner(pool: &str) -> Option<String> {
    match pool {
        "1" => Some("featuredCharacter".into()),
        "2" => Some("featuredWeapon".into()),
        "3" => Some("standardCharacter".into()),
        "4" => Some("standardWeapon".into()),
        _ => None,
    }
}

fn normalize_date_format(date_str: &str) -> String {
    // The API returns LOCAL time (EST/UTC-5) in format: "YYYY-MM-DD HH:MM:SS"
    // We need to convert to UTC by adding 5 hours, then format as: YYYY-MM-DDTHH:MM:SS+00:00
    
    // Already in correct format
    if date_str.contains('T') && date_str.ends_with("+00:00") {
        return date_str.to_string();
    }
    
    // Format: 2024-05-23T15:34:30Z -> 2024-05-23T15:34:30+00:00
    if date_str.ends_with('Z') {
        return date_str.replace('Z', "+00:00");
    }
    
    // Format: 2026-01-05 11:03:44 (from API in local time EST/UTC-5)
    // Need to convert to UTC by adding 5 hours
    if date_str.contains(' ') && !date_str.contains('T') {
        // Simple manual parsing and hour addition
        let parts: Vec<&str> = date_str.split(&[' ', '-', ':'][..]).collect();
        if parts.len() == 6 {
            if let (Ok(year), Ok(month), Ok(day), Ok(hour), Ok(minute), Ok(second)) = (
                parts[0].parse::<i32>(),
                parts[1].parse::<i32>(),
                parts[2].parse::<i32>(),
                parts[3].parse::<i32>(),
                parts[4].parse::<i32>(),
                parts[5].parse::<i32>(),
            ) {
                // Add 5 hours for EST->UTC conversion
                let mut new_hour = hour + 5;
                let mut new_day = day;
                let mut new_month = month;
                let mut new_year = year;
                
                // Handle hour overflow
                if new_hour >= 24 {
                    new_hour -= 24;
                    new_day += 1;
                    
                    // Handle day overflow (simplified - good enough for this use case)
                    let days_in_month = match new_month {
                        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
                        4 | 6 | 9 | 11 => 30,
                        2 => if new_year % 4 == 0 && (new_year % 100 != 0 || new_year % 400 == 0) { 29 } else { 28 },
                        _ => 31,
                    };
                    
                    if new_day > days_in_month {
                        new_day = 1;
                        new_month += 1;
                        if new_month > 12 {
                            new_month = 1;
                            new_year += 1;
                        }
                    }
                }
                
                return format!(
                    "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}+00:00",
                    new_year, new_month, new_day, new_hour, minute, second
                );
            }
        }
        
        // Fallback if parsing fails - just add markers without conversion
        return format!("{}+00:00", date_str.replace(' ', "T"));
    }
    
    // Default: return as-is
    date_str.to_string()
}

#[tauri::command]
pub fn get_pity_status(app: tauri::AppHandle) -> Result<Vec<PityStatus>, String> {
    let conn = init_db(&app)?;

    let banner_types = [
        "featuredCharacter",
        "featuredWeapon",
        "standardCharacter",
        "standardWeapon",
    ];

    let mut pity_statuses = Vec::new();

    for banner_type in banner_types {
        pity_statuses.push(calculate_pity_for_banner(&conn, banner_type)?);
    }

    Ok(pity_statuses)
}

fn calculate_pity_for_banner(
    conn: &rusqlite::Connection,
    banner_type: &str,
) -> Result<PityStatus, String> {
    // Sort by pull_number DESC - this is the true chronological order for each banner
    let mut stmt = conn
        .prepare(
            "SELECT rarity, item_name, item_type
             FROM pull_history
             WHERE banner_type = ?
             ORDER BY pull_number DESC",
        )
        .map_err(|e| e.to_string())?;

    let pulls: Vec<(i64, String, String)> = stmt
        .query_map([banner_type], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let mut current_pity_5star: i64 = 0;
    let mut current_pity_4star: i64 = 0;
    let mut last_5star_pull: Option<i64> = None;
    let mut last_4star_pull: Option<i64> = None;
    let mut guaranteed_next_fivestar = false;

    // Standard 5-star characters (losing 50/50 on character banner means getting one of these)
    let standard_5star_characters = vec![
        "Calcharo", "Verina", "Lingyang", "Jianxin", "Encore"
    ];
    
    // Standard 5-star weapons (losing 50/50 on weapon banner means getting one of these)
    let standard_5star_weapons = vec![
        "Emerald of Genesis", "Stringmaster", "Cosmic Ripples", "Lustrous Razor", "Static Mist"
    ];

    let is_featured_character = banner_type == "featuredCharacter";
    let is_featured_weapon = banner_type == "featuredWeapon";

    for (index, (rarity, item_name, item_type)) in pulls.iter().enumerate() {
        let idx = index as i64;

        if *rarity == 5 {
            if last_5star_pull.is_none() {
                last_5star_pull = Some(idx);
                
                // Check if this 5-star is off-banner (lost 50/50)
                if is_featured_character && item_type == "character" {
                    // Check if it's a standard character
                    if standard_5star_characters.contains(&item_name.as_str()) {
                        guaranteed_next_fivestar = true;
                    } else {
                        // Got featured character, next is 50/50
                        guaranteed_next_fivestar = false;
                    }
                } else if is_featured_weapon && item_type == "weapon" {
                    // Check if it's a standard weapon
                    if standard_5star_weapons.contains(&item_name.as_str()) {
                        guaranteed_next_fivestar = true;
                    } else {
                        // Got featured weapon, next is 50/50
                        guaranteed_next_fivestar = false;
                    }
                }
            }
        }

        if *rarity >= 4 && last_4star_pull.is_none() {
            last_4star_pull = Some(idx);
        }
    }

    for (rarity, _, _) in &pulls {
        if *rarity == 5 {
            break;
        }
        current_pity_5star += 1;
    }

    for (rarity, _, _) in &pulls {
        if *rarity >= 4 {
            break;
        }
        current_pity_4star += 1;
    }

    Ok(PityStatus {
        banner_type: banner_type.to_string(),
        current_pity_5star,
        current_pity_4star,
        guaranteed_next_fivestar,
        total_pulls: pulls.len() as i64,
        last_5star_pull,
        last_4star_pull,
    })
}