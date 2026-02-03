// src-tauri/src/assets/mapper.rs
//! Asset mapping and metadata management
//! 
//! This module creates a mapping between asset filenames and their
//! semantic meaning by scraping Prydwen and building a lookup table

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use scraper::{Html, Selector};

/// Metadata about a game asset
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetMetadata {
    pub id: String,
    pub filename: String,
    pub display_name: String,
    pub asset_type: String,
    pub rarity: Option<u8>,
    pub element: Option<String>,
    pub weapon_type: Option<String>,
    pub echo_class: Option<String>,
    pub cost: Option<u8>,
    pub tags: Vec<String>,
}

/// Asset mapping database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetMapper {
    /// Map from filename to metadata
    pub assets: HashMap<String, AssetMetadata>,
    /// Map from display name to filename (for easy lookup)
    pub name_to_file: HashMap<String, String>,
    /// Grouped by type
    pub by_type: HashMap<String, Vec<String>>,
}

impl AssetMapper {
    pub fn new() -> Self {
        Self {
            assets: HashMap::new(),
            name_to_file: HashMap::new(),
            by_type: HashMap::new(),
        }
    }

    /// Add a manually defined mapping
    pub fn add_asset(&mut self, metadata: AssetMetadata) {
        let filename = metadata.filename.clone();
        let display_name = metadata.display_name.clone();
        let asset_type = metadata.asset_type.clone();

        self.name_to_file.insert(display_name, filename.clone());
        self.by_type.entry(asset_type).or_insert_with(Vec::new).push(filename.clone());
        self.assets.insert(filename, metadata);
    }

    /// Get asset by filename
    pub fn get_by_filename(&self, filename: &str) -> Option<&AssetMetadata> {
        self.assets.get(filename)
    }

    /// Get asset by display name
    pub fn get_by_name(&self, name: &str) -> Option<&AssetMetadata> {
        self.name_to_file.get(name)
            .and_then(|filename| self.assets.get(filename))
    }

    /// Get all assets of a type
    pub fn get_by_type(&self, asset_type: &str) -> Vec<&AssetMetadata> {
        self.by_type.get(asset_type)
            .map(|filenames| {
                filenames.iter()
                    .filter_map(|f| self.assets.get(f))
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Build mappings by scraping Prydwen
    pub async fn build_from_prydwen(client: &reqwest::Client) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let mut mapper = Self::new();

        // Scrape characters
        mapper.scrape_characters(client).await?;
        
        // Scrape weapons
        mapper.scrape_weapons(client).await?;
        
        // Scrape echoes
        mapper.scrape_echoes(client).await?;

        Ok(mapper)
    }

    /// Scrape character data from Prydwen
    async fn scrape_characters(&mut self, client: &reqwest::Client) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let url = "https://www.prydwen.gg/wuthering-waves/characters/";
        let response = client.get(url).send().await?;
        let html = response.text().await?;
        let document = Html::parse_document(&html);

        // Prydwen uses a grid layout with character cards
        let card_selector = Selector::parse(".character-card, .employee-container").unwrap();
        
        for card in document.select(&card_selector) {
            if let Some(metadata) = Self::extract_character_metadata(card) {
                self.add_asset(metadata);
            }
        }

        Ok(())
    }

    /// Extract character metadata from HTML element
    fn extract_character_metadata(element: scraper::ElementRef) -> Option<AssetMetadata> {
        // Extract character name
        let name_selector = Selector::parse(".character-name, .name, h3, h4").unwrap();
        let name = element.select(&name_selector)
            .next()?
            .text()
            .collect::<String>()
            .trim()
            .to_lowercase();

        // Extract image source
        let img_selector = Selector::parse("img").unwrap();
        let img = element.select(&img_selector).next()?;
        let src = img.value().attr("src")?;
        
        let filename = src.split('/').last()?.to_string();

        // Extract rarity from data attributes or class names
        let rarity = element.value()
            .attr("data-rarity")
            .or_else(|| element.value().attr("data-stars"))
            .and_then(|r| r.parse().ok())
            .or_else(|| {
                element.value().attr("class")
                    .and_then(|c| {
                        if c.contains("rarity-5") || c.contains("5star") { Some(5) }
                        else if c.contains("rarity-4") || c.contains("4star") { Some(4) }
                        else { None }
                    })
            });

        // Extract element
        let element = element.value()
            .attr("data-element")
            .map(|s| s.to_string())
            .or_else(|| {
                element.value().attr("class")
                    .and_then(|c| {
                        if c.contains("aero") { Some("Aero".to_string()) }
                        else if c.contains("electro") { Some("Electro".to_string()) }
                        else if c.contains("fusion") { Some("Fusion".to_string()) }
                        else if c.contains("glacio") { Some("Glacio".to_string()) }
                        else if c.contains("havoc") { Some("Havoc".to_string()) }
                        else if c.contains("spectro") { Some("Spectro".to_string()) }
                        else { None }
                    })
            });

        Some(AssetMetadata {
            id: name.replace(" ", "_"),
            filename: filename.clone(),
            display_name: name.clone(),
            asset_type: "character".to_string(),
            rarity,
            element,
            weapon_type: None,
            echo_class: None,
            cost: None,
            tags: vec![],
        })
    }

    /// Scrape weapon data
    async fn scrape_weapons(&mut self, client: &reqwest::Client) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let url = "https://www.prydwen.gg/wuthering-waves/weapons/";
        let response = client.get(url).send().await?;
        let html = response.text().await?;
        let document = Html::parse_document(&html);

        // Similar pattern for weapons
        let card_selector = Selector::parse(".weapon-card, .item-card").unwrap();
        
        for card in document.select(&card_selector) {
            if let Some(metadata) = Self::extract_weapon_metadata(card) {
                self.add_asset(metadata);
            }
        }

        Ok(())
    }

    fn extract_weapon_metadata(element: scraper::ElementRef) -> Option<AssetMetadata> {
        // Similar extraction logic for weapons
        let name_selector = Selector::parse(".weapon-name, .name, h3, h4").unwrap();
        let name = element.select(&name_selector)
            .next()?
            .text()
            .collect::<String>()
            .trim()
            .to_lowercase();

        let img_selector = Selector::parse("img").unwrap();
        let img = element.select(&img_selector).next()?;
        let src = img.value().attr("src")?;
        let filename = src.split('/').last()?.to_string();

        Some(AssetMetadata {
            id: name.replace(" ", "_"),
            filename: filename.clone(),
            display_name: name.clone(),
            asset_type: "weapon".to_string(),
            rarity: None,
            element: None,
            weapon_type: None,
            echo_class: None,
            cost: None,
            tags: vec![],
        })
    }

    /// Scrape echo data
    async fn scrape_echoes(&mut self, client: &reqwest::Client) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let url = "https://www.prydwen.gg/wuthering-waves/echoes/";
        let response = client.get(url).send().await?;
        let html = response.text().await?;
        let document = Html::parse_document(&html);

        let card_selector = Selector::parse(".echo-card, .item-card").unwrap();
        
        for card in document.select(&card_selector) {
            if let Some(metadata) = Self::extract_echo_metadata(card) {
                self.add_asset(metadata);
            }
        }

        Ok(())
    }

    fn extract_echo_metadata(element: scraper::ElementRef) -> Option<AssetMetadata> {
        let name_selector = Selector::parse(".echo-name, .name, h3, h4").unwrap();
        let name = element.select(&name_selector)
            .next()?
            .text()
            .collect::<String>()
            .trim()
            .to_lowercase();

        let img_selector = Selector::parse("img").unwrap();
        let img = element.select(&img_selector).next()?;
        let src = img.value().attr("src")?;
        let filename = src.split('/').last()?.to_string();

        // Extract cost
        let cost = element.value()
            .attr("data-cost")
            .and_then(|c| c.parse().ok());

        Some(AssetMetadata {
            id: name.replace(" ", "_"),
            filename: filename.clone(),
            display_name: name.clone(),
            asset_type: "echo".to_string(),
            rarity: None,
            element: None,
            weapon_type: None,
            echo_class: None,
            cost,
            tags: vec![],
        })
    }

    /// Save mapping to JSON
    pub fn save_to_file(&self, path: &std::path::Path) -> Result<(), std::io::Error> {
        let json = serde_json::to_string_pretty(self)?;
        std::fs::write(path, json)?;
        Ok(())
    }

    /// Load mapping from JSON
    pub fn load_from_file(path: &std::path::Path) -> Result<Self, std::io::Error> {
        let json = std::fs::read_to_string(path)?;
        let mapper = serde_json::from_str(&json)?;
        Ok(mapper)
    }
}

impl Default for AssetMapper {
    fn default() -> Self {
        Self::new()
    }
}