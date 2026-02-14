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