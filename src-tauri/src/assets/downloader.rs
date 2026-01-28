// src-tauri/src/assets/downloader.rs
//! Asset downloader from Prydwen.gg

use super::cache::AssetCache;
use super::models::*;
use reqwest;
use scraper::{Html, Selector};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration as StdDuration;
use tokio::time::sleep;
use chrono::Utc;

pub struct AssetDownloader {
    client: reqwest::Client,
    config: AssetConfig,
}

impl AssetDownloader {
    /// Create a new downloader
    pub fn new() -> Self {
        let client = reqwest::Client::builder()
            .timeout(StdDuration::from_secs(AssetConfig::default().timeout_secs))
            .build()
            .expect("Failed to create HTTP client");

        Self {
            client,
            config: AssetConfig::default(),
        }
    }

    /// Download all assets
    pub async fn download_all(
        &self,
        base_path: &Path,
        cache: &mut AssetCache,
        progress_callback: Option<Box<dyn Fn(UpdateProgress) + Send + Sync>>,
    ) -> Result<UpdateSummary, Box<dyn std::error::Error + Send + Sync>> {
        let mut summary = UpdateSummary {
            downloaded: 0,
            cached: 0,
            failed: 0,
            total_assets: 0,
        };

        // Create asset directories
        self.create_directories(base_path)?;

        // Collect all asset URLs
        let mut all_assets = Vec::new();
        
        for (category, page_path) in &self.config.pages {
            let url = format!("{}{}", self.config.base_url, page_path);
            match self.extract_assets_from_page(&url).await {
                Ok(assets) => {
                    all_assets.extend(assets);
                }
                Err(e) => {
                    eprintln!("Failed to fetch page {}: {}", category, e);
                }
            }
        }

        // Remove duplicates
        all_assets.sort();
        all_assets.dedup();

        summary.total_assets = all_assets.len();

        // Download each asset
        for (index, asset_url) in all_assets.iter().enumerate() {
            if let Some(ref callback) = progress_callback {
                callback(UpdateProgress {
                    current: index + 1,
                    total: all_assets.len(),
                    current_asset: asset_url.clone(),
                    status: ProgressStatus::Fetching,
                });
            }

            // Check if already cached
            if cache.has_asset(asset_url) {
                let entry = cache.get_asset(asset_url).unwrap();
                if PathBuf::from(&entry.local_path).exists() {
                    summary.cached += 1;
                    
                    if let Some(ref callback) = progress_callback {
                        callback(UpdateProgress {
                            current: index + 1,
                            total: all_assets.len(),
                            current_asset: asset_url.clone(),
                            status: ProgressStatus::Cached,
                        });
                    }
                    
                    continue;
                }
            }

            // Download the asset
            match self.download_asset(asset_url, base_path).await {
                Ok(entry) => {
                    cache.add_asset(entry);
                    summary.downloaded += 1;
                    
                    if let Some(ref callback) = progress_callback {
                        callback(UpdateProgress {
                            current: index + 1,
                            total: all_assets.len(),
                            current_asset: asset_url.clone(),
                            status: ProgressStatus::Downloading,
                        });
                    }
                }
                Err(e) => {
                    eprintln!("Failed to download {}: {}", asset_url, e);
                    summary.failed += 1;
                    
                    if let Some(ref callback) = progress_callback {
                        callback(UpdateProgress {
                            current: index + 1,
                            total: all_assets.len(),
                            current_asset: asset_url.clone(),
                            status: ProgressStatus::Failed,
                        });
                    }
                }
            }

            // Rate limiting
            sleep(StdDuration::from_millis(self.config.rate_limit_ms)).await;
        }

        if let Some(callback) = progress_callback {
            callback(UpdateProgress {
                current: all_assets.len(),
                total: all_assets.len(),
                current_asset: String::new(),
                status: ProgressStatus::Complete,
            });
        }

        Ok(summary)
    }

    /// Extract asset URLs from a page
    async fn extract_assets_from_page(&self, url: &str) -> Result<Vec<String>, Box<dyn std::error::Error + Send + Sync>> {
        let response = self.client.get(url).send().await?;
        let html = response.text().await?;
        let document = Html::parse_document(&html);
        
        let img_selector = Selector::parse("img").unwrap();
        let mut assets = Vec::new();

        for element in document.select(&img_selector) {
            if let Some(src) = element.value().attr("src") {
                if src.contains("/static/") && self.is_valid_extension(src) {
                    let full_url = if src.starts_with("http") {
                        src.to_string()
                    } else {
                        format!("{}{}", self.config.base_url, src)
                    };
                    assets.push(full_url);
                }
            }
        }

        Ok(assets)
    }

    /// Download a single asset
    async fn download_asset(
        &self,
        url: &str,
        base_path: &Path,
    ) -> Result<AssetEntry, Box<dyn std::error::Error + Send + Sync>> {
        let mut last_error: Option<String> = None;

        // Retry logic
        for attempt in 0..self.config.max_retries {
            match self.try_download(url, base_path).await {
                Ok(entry) => return Ok(entry),
                Err(e) => {
                    last_error = Some(e.to_string());
                    if attempt < self.config.max_retries - 1 {
                        sleep(StdDuration::from_secs(2u64.pow(attempt))).await;
                    }
                }
            }
        }

        Err(last_error.unwrap().into())
    }

    /// Try to download an asset once
    async fn try_download(
        &self,
        url: &str,
        base_path: &Path,
    ) -> Result<AssetEntry, Box<dyn std::error::Error + Send + Sync>> {
        let response = self.client.get(url).send().await?;
        let bytes = response.bytes().await?;

        let asset_type = AssetType::from_url(url);
        let filename = url.split('/').last()
            .ok_or("Invalid URL - no filename")?
            .to_string();

        let local_dir = base_path.join(asset_type.as_str());
        let local_path = local_dir.join(&filename);

        fs::write(&local_path, &bytes)?;

        Ok(AssetEntry {
            url: url.to_string(),
            local_path: local_path.to_string_lossy().to_string(),
            asset_type,
            filename,
            size_bytes: bytes.len() as u64,
            downloaded_at: Utc::now(),
        })
    }

    /// Create asset directories
    fn create_directories(&self, base_path: &Path) -> Result<(), std::io::Error> {
        for asset_type in &[
            AssetType::Character,
            AssetType::Weapon,
            AssetType::Echo,
            AssetType::Element,
            AssetType::Misc,
        ] {
            let dir = base_path.join(asset_type.as_str());
            fs::create_dir_all(dir)?;
        }
        Ok(())
    }

    /// Check if file extension is valid
    fn is_valid_extension(&self, url: &str) -> bool {
        let url_lower = url.to_lowercase();
        url_lower.ends_with(".webp")
            || url_lower.ends_with(".png")
            || url_lower.ends_with(".jpg")
            || url_lower.ends_with(".jpeg")
    }
}

impl Default for AssetDownloader {
    fn default() -> Self {
        Self::new()
    }
}