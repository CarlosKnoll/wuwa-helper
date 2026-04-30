// src-tauri/src/assets/mod.rs
//! Asset management module for Wuthering Waves assets

use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub mod models;
pub mod mapper;
pub mod resolver;
pub mod mappings_loader;

pub use mapper::AssetMapper;
pub use resolver::AssetResolver;
pub use models::*;

pub struct AssetManager {
    resolver: AssetResolver,
    bundled_base_path: PathBuf,
    runtime_base_path: PathBuf,
    metadata_version: String,
    pub mapper: AssetMapper,
}

impl AssetManager {
    pub async fn new(app_handle: AppHandle) -> Result<Self, AssetError> {
        let bundled_base_path = app_handle
            .path()
            .resource_dir()
            .map_err(|e| AssetError::PathError(format!("Failed to get resource dir: {}", e)))?
            .join("wuwa-helper-assets")
            .join("assets");

        if !bundled_base_path.exists() {
            return Err(AssetError::PathError(format!(
                "Bundled assets directory not found at: {}",
                bundled_base_path.display()
            )));
        }

        let runtime_base_path = std::env::current_exe()
            .map_err(|e| AssetError::PathError(format!("Failed to get executable path: {}", e)))?
            .parent()
            .ok_or_else(|| AssetError::PathError("Failed to get executable directory".to_string()))?
            .to_path_buf()
            .join("runtime-assets")
            .join("assets");

        let bundled_metadata_path = bundled_base_path.join("metadata.json");
        let runtime_metadata_path = runtime_base_path.join("metadata.json");

        let metadata = if runtime_metadata_path.exists() {
            mappings_loader::load_metadata_file(&runtime_metadata_path)
                .map_err(AssetError::Generic)?
        } else {
            mappings_loader::load_metadata_file(&bundled_metadata_path)
                .map_err(AssetError::Generic)?
        };

        let mut mapper = AssetMapper::new();

        for meta in &metadata.entries {
            // name_to_file: only index entries that have a filename
            if let Some(ref filename) = meta.filename {
                mapper
                    .name_to_file
                    .insert(meta.display_name.clone(), filename.clone());

                // assets: keyed by filename for entries that have one
                mapper
                    .assets
                    .insert(filename.clone(), meta.clone());
            } else {
                // Entries without a filename (e.g. exploration_region) are
                // indexed by their id so they can still be looked up.
                mapper
                    .assets
                    .insert(meta.id.clone(), meta.clone());
            }

            mapper
                .by_type
                .entry(meta.asset_type.clone())
                .or_default()
                .push(
                    meta.filename
                        .clone()
                        .unwrap_or_else(|| meta.id.clone()),
                );
        }

        let resolver = AssetResolver::new_with_mappings(
            mapper.clone(),
            std::collections::HashMap::new(),
        );

        Ok(Self {
            resolver,
            bundled_base_path,
            runtime_base_path,
            metadata_version: metadata.version,
            mapper,
        })
    }

    /// Constructs an empty AssetManager used as a fallback when assets are unavailable.
    /// All asset lookups will return NotFound errors, but the app remains functional.
    pub fn empty() -> Self {
        let mapper = AssetMapper::new();
        let resolver = AssetResolver::new_with_mappings(
            mapper.clone(),
            std::collections::HashMap::new(),
        );
        Self {
            resolver,
            bundled_base_path: PathBuf::new(),
            runtime_base_path: PathBuf::new(),
            metadata_version: "0.0.0".to_string(),
            mapper,
        }
    }

    pub fn get_all_mappings(&self) -> &std::collections::HashMap<String, mapper::AssetMetadata> {
        &self.mapper.assets
    }

    fn candidate_base_paths(&self) -> Vec<&PathBuf> {
        let mut paths = Vec::new();

        if self.runtime_base_path.exists() {
            paths.push(&self.runtime_base_path);
        }

        paths.push(&self.bundled_base_path);
        paths
    }

    pub fn get_asset_path(&self, asset_type: AssetType, name: &str) -> Option<PathBuf> {

        if matches!(asset_type, AssetType::Echo) {
            if let Some(metadata) = self.resolver.resolve_by_name(name) {
                if let Some(ref filename) = metadata.filename {
                    for base_path in self.candidate_base_paths() {
                        let path = base_path.join(asset_type.as_str()).join(filename);
                        if path.exists() { return Some(path); }
                    }
                }
            }

            for base_path in self.candidate_base_paths() {
                let direct_path = base_path.join(asset_type.as_str()).join(name);
                if direct_path.exists() { return Some(direct_path); }
            }

            if !name.ends_with(".webp") && !name.ends_with(".png") {
                for base_path in self.candidate_base_paths() {
                    let with_webp = base_path.join(asset_type.as_str()).join(format!("{}.webp", name));
                    if with_webp.exists() { return Some(with_webp); }
                }
            }

            let name_id = name.to_lowercase().replace(" ", "_").replace("'", "");
            if let Some(metadata) = self.resolver.resolve_by_name(&name_id) {
                if let Some(ref filename) = metadata.filename {
                    for base_path in self.candidate_base_paths() {
                        let path = base_path.join(asset_type.as_str()).join(filename);
                        if path.exists() { return Some(path); }
                    }
                }
            }
        }

        if matches!(asset_type, AssetType::Character) {
            if let Some(filename) = self.resolver.get_asset_filename(name) {
                for base_path in self.candidate_base_paths() {
                    let path = base_path.join(asset_type.as_str()).join(&filename);
                    if path.exists() { return Some(path); }
                }
            }
        }

        if matches!(asset_type, AssetType::Weapon) {
            if let Some(metadata) = self.resolver.resolve_by_name(name) {
                if let Some(ref filename) = metadata.filename {
                    if filename.starts_with("weapon_") {
                        for base_path in self.candidate_base_paths() {
                            let path = base_path.join("weapons").join(filename);
                            if path.exists() { return Some(path); }
                        }
                    } else if filename.chars().next().unwrap_or('a').is_numeric() {
                        if let Some(ref weapon_type) = metadata.weapon_type {
                            for base_path in self.candidate_base_paths() {
                                let path = base_path.join("weapons").join(weapon_type.to_lowercase()).join(filename);
                                if path.exists() { return Some(path); }
                            }
                        }
                    } else {
                        if let Some(ref weapon_type) = metadata.weapon_type {
                            for base_path in self.candidate_base_paths() {
                                let path = base_path.join("weapons").join(weapon_type.to_lowercase()).join(filename);
                                if path.exists() { return Some(path); }
                            }
                        }
                    }
                }
            }

            if let Some(metadata) = self.resolver.resolve_by_filename(name) {
                if let Some(ref filename) = metadata.filename {
                    if filename.starts_with("weapon_") {
                        for base_path in self.candidate_base_paths() {
                            let path = base_path.join("weapons").join(filename);
                            if path.exists() { return Some(path); }
                        }
                    } else if let Some(ref weapon_type) = metadata.weapon_type {
                        for base_path in self.candidate_base_paths() {
                            let path = base_path.join("weapons").join(weapon_type.to_lowercase()).join(filename);
                            if path.exists() { return Some(path); }
                        }
                    }
                }
            }

            if name.starts_with("weapon_") {
                for base_path in self.candidate_base_paths() {
                    let path = base_path.join("weapons").join(name);
                    if path.exists() { return Some(path); }
                }
                for base_path in self.candidate_base_paths() {
                    let path = base_path.join("weapons").join(format!("{}.png", name));
                    if path.exists() { return Some(path); }
                }
            }

            for weapon_type in &["broadblade", "sword", "pistol", "gauntlet", "rectifier"] {
                for base_path in self.candidate_base_paths() {
                    let path = base_path.join("weapons").join(weapon_type).join(name);
                    if path.exists() { return Some(path); }
                }
                for base_path in self.candidate_base_paths() {
                    let path = base_path.join("weapons").join(weapon_type).join(format!("{}.webp", name));
                    if path.exists() { return Some(path); }
                }
            }
        }

        if matches!(asset_type, AssetType::Element) {
            for base_path in self.candidate_base_paths() {
                let direct_path = base_path.join(asset_type.as_str()).join(name);
                if direct_path.exists() { return Some(direct_path); }
            }
            if !name.ends_with(".png") {
                for base_path in self.candidate_base_paths() {
                    let with_png = base_path.join(asset_type.as_str()).join(format!("{}.png", name));
                    if with_png.exists() { return Some(with_png); }
                }
            }
        }

        if matches!(asset_type, AssetType::EchoSet) {
            for base_path in self.candidate_base_paths() {
                let direct_path = base_path.join(asset_type.as_str()).join(name);
                if direct_path.exists() { return Some(direct_path); }
            }
            if !name.ends_with(".webp") {
                for base_path in self.candidate_base_paths() {
                    let with_webp = base_path.join(asset_type.as_str()).join(format!("{}.webp", name));
                    if with_webp.exists() { return Some(with_webp); }
                }
            }
        }

        if matches!(asset_type, AssetType::Misc) {
            for base_path in self.candidate_base_paths() {
                let direct_path = base_path.join(asset_type.as_str()).join(name);
                if direct_path.exists() { return Some(direct_path); }
            }
            if !name.ends_with(".png") {
                for base_path in self.candidate_base_paths() {
                    let with_png = base_path.join(asset_type.as_str()).join(format!("{}.png", name));
                    if with_png.exists() { return Some(with_png); }
                }
            }
        }

        if matches!(asset_type, AssetType::Exploration) {
            for base_path in self.candidate_base_paths() {
                let direct_path = base_path.join(asset_type.as_str()).join(name);
                if direct_path.exists() { return Some(direct_path); }
            }
            if !name.ends_with(".webp") && !name.ends_with(".png") {
                for base_path in self.candidate_base_paths() {
                    let with_webp = base_path.join(asset_type.as_str()).join(format!("{}.webp", name));
                    if with_webp.exists() { return Some(with_webp); }
                }
                for base_path in self.candidate_base_paths() {
                    let with_png = base_path.join(asset_type.as_str()).join(format!("{}.png", name));
                    if with_png.exists() { return Some(with_png); }
                }
            }
        }

        None
    }

    pub fn get_asset_base64(&self, asset_type: AssetType, name: &str) -> Result<String, AssetError> {
        let path = self.get_asset_path(asset_type, name)
            .ok_or(AssetError::NotFound(format!("{}/{}", asset_type, name)))?;

        let bytes = fs::read(&path)?;
        use base64::Engine;
        Ok(base64::engine::general_purpose::STANDARD.encode(&bytes))
    }
}

#[derive(Debug, thiserror::Error)]
pub enum AssetError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),

    #[error("Path error: {0}")]
    PathError(String),

    #[error("Asset not found: {0}")]
    NotFound(String),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Generic error: {0}")]
    Generic(String),
}

impl From<Box<dyn std::error::Error + Send + Sync>> for AssetError {
    fn from(err: Box<dyn std::error::Error + Send + Sync>) -> Self {
        AssetError::Generic(err.to_string())
    }
}