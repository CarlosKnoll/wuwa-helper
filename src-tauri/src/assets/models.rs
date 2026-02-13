// src-tauri/src/assets/models.rs
//! Data models for asset management

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AssetType {
    Character,
    Weapon,
    Echo,
    EchoSet,
    Element,
    Misc,
}

impl AssetType {
    pub fn as_str(&self) -> &str {
        match self {
            AssetType::Character => "characters",
            AssetType::Weapon => "weapons",
            AssetType::Echo => "echoes",
            AssetType::EchoSet => "echo_sets",
            AssetType::Element => "elements",
            AssetType::Misc => "misc",
        }
    }

    pub fn from_url(url: &str) -> Self {
        let url_lower = url.to_lowercase();
        if url_lower.contains("element_") {
            AssetType::Element
        } else if url_lower.contains("_card") || url_lower.contains("character") || url_lower.contains("characters") {
            AssetType::Character
        } else if url_lower.contains("weapon") {
            AssetType::Weapon
        } else if url_lower.contains("set_") || url_lower.contains("echo_set") {
            AssetType::EchoSet
        } else if url_lower.contains("echo") {
            AssetType::Echo
        } else {
            AssetType::Misc
        }
    }
}

// Fixed: Implement Display trait for AssetType
impl fmt::Display for AssetType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetEntry {
    pub url: String,
    pub local_path: String,
    pub asset_type: AssetType,
    pub filename: String,
    pub size_bytes: u64,
    pub downloaded_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheMetadata {
    pub last_update: Option<DateTime<Utc>>,
    pub total_assets: usize,
    pub assets_by_type: HashMap<AssetType, usize>,
    pub version: String,
}

impl Default for CacheMetadata {
    fn default() -> Self {
        Self {
            last_update: None,
            total_assets: 0,
            assets_by_type: HashMap::new(),
            version: env!("CARGO_PKG_VERSION").to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProgress {
    pub current: usize,
    pub total: usize,
    pub current_asset: String,
    pub status: ProgressStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ProgressStatus {
    Fetching,
    Downloading,
    Cached,
    Failed,
    Complete,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateSummary {
    pub downloaded: usize,
    pub cached: usize,
    pub failed: usize,
    pub total_assets: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheStats {
    pub total_assets: usize,
    pub assets_by_type: HashMap<AssetType, usize>,
    pub last_update: Option<DateTime<Utc>>,
    pub cache_size_mb: f64,
}

/// Configuration for asset downloading
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetConfig {
    pub base_url: String,
    pub pages: HashMap<String, String>,
    pub rate_limit_ms: u64,
    pub timeout_secs: u64,
    pub max_retries: u32,
}

impl Default for AssetConfig {
    fn default() -> Self {
        let mut pages = HashMap::new();
        pages.insert("characters".to_string(), "/wuthering-waves/characters/".to_string());
        pages.insert("weapons".to_string(), "/wuthering-waves/weapons/".to_string());
        pages.insert("echoes".to_string(), "/wuthering-waves/echoes/".to_string());

        Self {
            base_url: "https://www.prydwen.gg".to_string(),
            pages,
            rate_limit_ms: 500,
            timeout_secs: 30,
            max_retries: 3,
        }
    }
}