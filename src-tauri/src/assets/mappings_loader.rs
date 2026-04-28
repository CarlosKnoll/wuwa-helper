use super::mapper::AssetMetadata;
use semver::Version;
use serde::{Deserialize, Serialize};
use std::fs;
use std::fs::File;
use std::io::{Cursor, copy};
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};
use zip::ZipArchive;

const REMOTE_METADATA_URL: &str =
    "https://github.com/CarlosKnoll/wuwa-helper-assets-runtime/releases/latest/download/metadata.json";
const REMOTE_ASSETS_ZIP_URL: &str =
    "https://github.com/CarlosKnoll/wuwa-helper-assets-runtime/releases/latest/download/assets.zip";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetadataFile {
    pub version: String,
    pub entries: Vec<AssetMetadata>,
}

pub fn load_metadata_file(path: &Path) -> Result<MetadataFile, String> {
    let raw = fs::read_to_string(path)
        .map_err(|e| format!("Failed to read metadata file {}: {}", path.display(), e))?;

    let parsed: MetadataFile = serde_json::from_str(&raw)
        .map_err(|e| format!("Failed to parse metadata file {}: {}", path.display(), e))?;

    Ok(parsed)
}

pub async fn ensure_runtime_assets_current(app: &AppHandle) -> Result<(), String> {
    let bundled_assets_path = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {}", e))?
        .join("wuwa-helper-assets")
        .join("assets");

    let runtime_root = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?
        .join("runtime-assets");

    let runtime_assets_path = runtime_root.join("assets");
    let runtime_metadata_path = runtime_assets_path.join("metadata.json");
    let bundled_metadata_path = bundled_assets_path.join("metadata.json");

    let local_metadata = if runtime_metadata_path.exists() {
        load_metadata_file(&runtime_metadata_path)?
    } else {
        load_metadata_file(&bundled_metadata_path)?
    };

    let remote_metadata = fetch_remote_metadata().await?;

    if !is_remote_newer(&local_metadata.version, &remote_metadata.version)? {
        return Ok(());
    }

    let zip_bytes = download_assets_zip().await?;
    install_runtime_assets(&runtime_root, &remote_metadata, &zip_bytes)?;

    Ok(())
}

async fn fetch_remote_metadata() -> Result<MetadataFile, String> {
    let bytes = fetch_bytes(REMOTE_METADATA_URL).await?;
    let parsed: MetadataFile = serde_json::from_slice(&bytes)
        .map_err(|e| format!("Failed to parse remote metadata.json: {}", e))?;

    Ok(parsed)
}

async fn download_assets_zip() -> Result<Vec<u8>, String> {
    fetch_bytes(REMOTE_ASSETS_ZIP_URL).await
}

async fn fetch_bytes(url: &str) -> Result<Vec<u8>, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Failed to GET {}: {}", url, e))?;

    if !response.status().is_success() {
        return Err(format!(
            "GET {} failed with status {}",
            url,
            response.status()
        ));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response body from {}: {}", url, e))?;

    Ok(bytes.to_vec())
}

fn is_remote_newer(local_version: &str, remote_version: &str) -> Result<bool, String> {
    let local = Version::parse(local_version)
        .map_err(|e| format!("Failed to parse local version '{}': {}", local_version, e))?;

    let remote = Version::parse(remote_version)
        .map_err(|e| format!("Failed to parse remote version '{}': {}", remote_version, e))?;

    Ok(remote > local)
}

fn install_runtime_assets(
    runtime_root: &Path,
    expected_metadata: &MetadataFile,
    zip_bytes: &[u8],
) -> Result<(), String> {
    let runtime_tmp_root = sibling_tmp_dir(runtime_root);

    if runtime_tmp_root.exists() {
        fs::remove_dir_all(&runtime_tmp_root).map_err(|e| {
            format!(
                "Failed to remove old temp runtime dir {}: {}",
                runtime_tmp_root.display(),
                e
            )
        })?;
    }

    if let Some(parent) = runtime_root.parent() {
        fs::create_dir_all(parent).map_err(|e| {
            format!(
                "Failed to create runtime assets parent dir {}: {}",
                parent.display(),
                e
            )
        })?;
    }

    fs::create_dir_all(&runtime_tmp_root).map_err(|e| {
        format!(
            "Failed to create temp runtime dir {}: {}",
            runtime_tmp_root.display(),
            e
        )
    })?;

    extract_zip_into(&runtime_tmp_root, zip_bytes)?;

    let extracted_metadata_path = runtime_tmp_root.join("assets").join("metadata.json");
    if !extracted_metadata_path.exists() {
        return Err(format!(
            "Extracted assets are missing metadata.json at {}",
            extracted_metadata_path.display()
        ));
    }

    let extracted_metadata = load_metadata_file(&extracted_metadata_path)?;
    if extracted_metadata.version != expected_metadata.version {
        return Err(format!(
            "Extracted metadata version mismatch. Expected {}, got {}",
            expected_metadata.version,
            extracted_metadata.version
        ));
    }

    if runtime_root.exists() {
        fs::remove_dir_all(runtime_root).map_err(|e| {
            format!(
                "Failed to remove old runtime assets dir {}: {}",
                runtime_root.display(),
                e
            )
        })?;
    }

    fs::rename(&runtime_tmp_root, runtime_root).map_err(|e| {
        format!(
            "Failed to promote temp runtime dir {} to {}: {}",
            runtime_tmp_root.display(),
            runtime_root.display(),
            e
        )
    })?;

    Ok(())
}

fn extract_zip_into(destination_root: &Path, zip_bytes: &[u8]) -> Result<(), String> {
    let reader = Cursor::new(zip_bytes);
    let mut archive = ZipArchive::new(reader)
        .map_err(|e| format!("Failed to open assets.zip: {}", e))?;

    for index in 0..archive.len() {
        let mut entry = archive
            .by_index(index)
            .map_err(|e| format!("Failed to read zip entry #{}: {}", index, e))?;

        let output_path = destination_root.join(entry.mangled_name());

        if entry.name().ends_with('/') {
            fs::create_dir_all(&output_path).map_err(|e| {
                format!(
                    "Failed to create extracted directory {}: {}",
                    output_path.display(),
                    e
                )
            })?;
            continue;
        }

        if let Some(parent) = output_path.parent() {
            fs::create_dir_all(parent).map_err(|e| {
                format!(
                    "Failed to create extracted parent directory {}: {}",
                    parent.display(),
                    e
                )
            })?;
        }

        let mut output_file = File::create(&output_path).map_err(|e| {
            format!(
                "Failed to create extracted file {}: {}",
                output_path.display(),
                e
            )
        })?;

        copy(&mut entry, &mut output_file).map_err(|e| {
            format!(
                "Failed to extract file {}: {}",
                output_path.display(),
                e
            )
        })?;
    }

    Ok(())
}

fn sibling_tmp_dir(runtime_root: &Path) -> PathBuf {
    let parent = runtime_root
        .parent()
        .map(Path::to_path_buf)
        .unwrap_or_else(|| PathBuf::from("."));

    let dir_name = runtime_root
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("runtime-assets");

    parent.join(format!("{}-tmp", dir_name))
}
