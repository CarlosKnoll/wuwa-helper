use crate::db::{init_db, Goal};
use rusqlite::Result;

#[tauri::command]
pub fn get_goals(app: tauri::AppHandle) -> Result<Vec<Goal>, String> {
    let conn = init_db(&app)?;
    
    let mut stmt = conn
        .prepare("SELECT id, goal_text, priority, category, notes, astrite_needed, estimated_banner FROM goals ORDER BY 
            CASE 
                WHEN category = 'immediate' THEN 1
                WHEN category = 'shortTerm' THEN 2
                WHEN category = 'longTerm' THEN 3
                ELSE 4
            END,
            CASE 
                WHEN priority = 'highest' THEN 0
                WHEN priority = 'high' THEN 1
                WHEN priority = 'medium' THEN 2
                WHEN priority = 'low' THEN 3
                ELSE 4
            END")
        .map_err(|e| e.to_string())?;
    
    let goals = stmt
        .query_map([], |row| {
            Ok(Goal {
                id: row.get(0)?,
                goal_text: row.get(1)?,
                priority: row.get(2)?,
                category: row.get(3)?,
                notes: row.get(4)?,
                astrite_needed: row.get(5)?,
                estimated_banner: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    
    Ok(goals)
}

#[tauri::command]
pub fn update_goal(
    app: tauri::AppHandle,
    id: i64,
    goal_text: String,
    priority: Option<String>,
    category: Option<String>,
    notes: Option<String>,
    astrite_needed: Option<i64>,
    estimated_banner: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "UPDATE goals SET goal_text = ?, priority = ?, category = ?, notes = ?, astrite_needed = ?, estimated_banner = ? WHERE id = ?",
        (goal_text, priority, category, notes, astrite_needed, estimated_banner, id),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Goal updated successfully".to_string())
}

#[tauri::command]
pub fn add_goal(
    app: tauri::AppHandle,
    goal_text: String,
    priority: Option<String>,
    category: Option<String>,
    notes: Option<String>,
    astrite_needed: Option<i64>,
    estimated_banner: Option<String>,
) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute(
        "INSERT INTO goals (goal_text, priority, category, notes, astrite_needed, estimated_banner) VALUES (?, ?, ?, ?, ?, ?)",
        (goal_text, priority, category, notes, astrite_needed, estimated_banner),
    )
    .map_err(|e| e.to_string())?;
    
    Ok("Goal added successfully".to_string())
}

#[tauri::command]
pub fn delete_goal(app: tauri::AppHandle, id: i64) -> Result<String, String> {
    let conn = init_db(&app)?;
    
    conn.execute("DELETE FROM goals WHERE id = ?", [id])
        .map_err(|e| e.to_string())?;
    
    Ok("Goal deleted successfully".to_string())
}
