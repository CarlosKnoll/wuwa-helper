// src-tauri/src/assets/models.rs
//! Data models for asset management

use serde::{Deserialize, Serialize};
use std::fmt;

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