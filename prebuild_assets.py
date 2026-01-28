#!/usr/bin/env python3
"""
Wuthering Waves Asset Manager v3.0
Unified asset downloader with intelligent categorization and organization
"""

import os
import re
import json
import time
import hashlib
import requests
import argparse
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from datetime import datetime
from typing import Dict, List, Set, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging


class WWAssetManager:
    """
    Intelligent asset manager for Wuthering Waves
    Handles downloading, categorization, and organization of game assets
    """
    
    # Weapon type mappings based on ID prefixes
    WEAPON_TYPE_MAP = {
        '2101': 'broadblade',
        '2102': 'sword',
        '2103': 'pistol',
        '2104': 'gauntlet',
        '2105': 'rectifier'
    }
    
    def __init__(self, config_file: Optional[str] = None, base_dir: Optional[str] = None, 
                 prebuild_mode: bool = False):
        """
        Initialize the asset manager
        
        Args:
            config_file: Optional path to JSON configuration file
            base_dir: Optional base directory override
            prebuild_mode: If True, sets up for Tauri prebuild
        """
        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        
        # Load configuration
        self.config = self.load_config(config_file)
        
        # Override base_dir if provided
        if base_dir:
            self.config['base_directory'] = base_dir
        elif prebuild_mode:
            # For prebuild, use Tauri resources directory
            script_dir = Path(__file__).parent
            self.config['base_directory'] = str(script_dir / "src-tauri" / "resources" / "assets")
        
        self.base_url = self.config['base_url']
        self.base_dir = Path(self.config['base_directory'])
        self.cache_file = self.base_dir / "asset_cache.json"
        self.metadata_file = self.base_dir / "metadata.json"
        
        # Setup
        self.setup_directories()
        self.cache = self.load_cache()
        self.metadata = self.load_metadata()
        
        # Session for requests
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': self.config['download_settings']['user_agent']
        })
        
        # Statistics
        self.stats = {
            'downloaded': 0,
            'cached': 0,
            'failed': 0,
            'ignored': 0,
            'reorganized': 0
        }
    
    def load_config(self, config_file: Optional[str] = None) -> Dict:
        """Load configuration from file or use defaults"""
        default_config = {
            "base_url": "https://www.prydwen.gg",
            "base_directory": "./ww_assets",
            "pages": {
                "characters": "/wuthering-waves/characters/",
                "weapons": "/wuthering-waves/weapons/",
                "echoes": "/wuthering-waves/echoes/"
            },
            "asset_filters": {
                "extensions": [".webp", ".png", ".jpg", ".jpeg"],
                "min_size_kb": 0,
                "max_size_mb": 10
            },
            "download_settings": {
                "rate_limit_seconds": 0.3,
                "timeout_seconds": 30,
                "retry_attempts": 3,
                "parallel_downloads": 8,
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        }
        
        if config_file and Path(config_file).exists():
            try:
                with open(config_file, 'r') as f:
                    user_config = json.load(f)
                    # Deep merge with defaults
                    default_config.update(user_config)
                    self.logger.info(f"Loaded configuration from {config_file}")
            except Exception as e:
                self.logger.warning(f"Error loading config: {e}. Using defaults.")
        
        return default_config
    
    def setup_directories(self):
        """Create necessary directory structure"""
        categories = {
            'characters',
            'weapons',
            'echoes', 
            'elements',
            'echo_sets',
            'misc'
        }
        
        # Add weapon type subdirectories
        weapon_subdirs = set(self.WEAPON_TYPE_MAP.values())
        
        directories = [self.base_dir]
        
        # Create category directories
        for cat in categories:
            directories.append(self.base_dir / cat)
        
        # Create weapon subdirectories
        for weapon_type in weapon_subdirs:
            directories.append(self.base_dir / 'weapons' / weapon_type)
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
    
    def load_cache(self) -> Dict:
        """Load the asset cache from JSON file"""
        if self.cache_file.exists():
            try:
                with open(self.cache_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                self.logger.error(f"Error loading cache: {e}")
                return {}
        return {}
    
    def save_cache(self):
        """Save the asset cache to JSON file"""
        try:
            with open(self.cache_file, 'w') as f:
                json.dump(self.cache, f, indent=2)
        except Exception as e:
            self.logger.error(f"Error saving cache: {e}")
    
    def load_metadata(self) -> Dict:
        """Load metadata about downloads"""
        if self.metadata_file.exists():
            try:
                with open(self.metadata_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                self.logger.error(f"Error loading metadata: {e}")
        
        return {
            "last_update": None,
            "total_assets": 0,
            "categories": {},
            "history": []
        }
    
    def save_metadata(self):
        """Save metadata about downloads"""
        self.metadata["last_update"] = datetime.now().isoformat()
        
        # Add to history
        self.metadata["history"].append({
            "timestamp": datetime.now().isoformat(),
            "downloaded": self.stats['downloaded'],
            "cached": self.stats['cached'],
            "failed": self.stats['failed'],
            "ignored": self.stats['ignored'],
            "reorganized": self.stats['reorganized']
        })
        
        # Keep only last 50 history entries
        if len(self.metadata["history"]) > 50:
            self.metadata["history"] = self.metadata["history"][-50:]
        
        try:
            with open(self.metadata_file, 'w') as f:
                json.dump(self.metadata, f, indent=2)
        except Exception as e:
            self.logger.error(f"Error saving metadata: {e}")
    
    def get_url_hash(self, url: str) -> str:
        """Generate a hash for a URL to use as cache key"""
        return hashlib.md5(url.encode()).hexdigest()
    
    def should_ignore_asset(self, filename: str) -> bool:
        """
        Check if an asset should be ignored based on patterns
        
        Ignores:
        - category_XXXX.jpg files
        - Any files that don't match known patterns
        """
        filename_lower = filename.lower()
        
        # Ignore category thumbnails
        if re.match(r'category_\d+\.(jpg|jpeg|png|webp)', filename_lower):
            return True
        
        return False
    
    def categorize_and_standardize(self, url: str, filename: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Intelligently categorize an asset and standardize its filename
        
        Returns:
            Tuple of (category, standardized_filename) or (None, None) if should be ignored
        """
        # Check if should be ignored
        if self.should_ignore_asset(filename):
            return None, None
        
        filename_lower = filename.lower()
        filename_base = os.path.splitext(filename)[0]
        file_ext = os.path.splitext(filename)[1]
        
        # Extract numeric ID if present
        id_match = re.search(r'(\d+)', filename_base)
        asset_id = id_match.group(1) if id_match else None
        
        # Element icons
        if 'element_' in filename_lower:
            return 'elements', filename
        
        # Character cards - standardize to XXXX_card format
        if '_card' in filename_lower or 'card_' in filename_lower:
            # Extract character name or ID
            if asset_id:
                standardized = f"{asset_id}_card{file_ext}"
            else:
                # Try to extract character name
                name_match = re.match(r'(.+?)_card', filename_base, re.IGNORECASE)
                if name_match:
                    standardized = f"{name_match.group(1)}_card{file_ext}"
                else:
                    standardized = filename
            return 'characters', standardized
        
        # Echo images (in misc folder)
        if asset_id:
            # 60XXXXX or 31XXXXXXX indicates echo
            if asset_id.startswith('60') or asset_id.startswith('31'):
                return 'echoes', filename
            
            # 21XXXXX indicates weapon
            if asset_id.startswith('21') and len(asset_id) >= 6:
                weapon_prefix = asset_id[:4]
                if weapon_prefix in self.WEAPON_TYPE_MAP:
                    weapon_type = self.WEAPON_TYPE_MAP[weapon_prefix]
                    # Create subdirectory path
                    return f'weapons/{weapon_type}', filename
                else:
                    # Unknown weapon type, put in general weapons folder
                    return 'weapons', filename
        
        # Echo set icons
        if re.match(r'set_\d+', filename_lower):
            return 'echo_sets', filename
        
        # URL-based categorization (less reliable, used as fallback)
        url_lower = url.lower()
        if 'character' in url_lower and '_card' not in filename_lower:
            return 'characters', filename
        elif 'weapon' in url_lower:
            return 'weapons', filename
        elif 'echo' in url_lower:
            return 'echoes', filename
        
        # If we get here and it's a recognized asset type, put in misc
        # Otherwise ignore it
        if asset_id and (asset_id.startswith(('60', '31', '21')) or '_card' in filename_lower):
            return 'misc', filename
        
        # Unknown/unneeded asset - ignore
        return None, None
    
    def download_asset(self, url: str) -> Optional[str]:
        """Download a single asset and return local path"""
        # Make URL absolute
        if not url.startswith('http'):
            url = urljoin(self.base_url, url)
        
        # Validate asset
        if not self.is_valid_asset(url):
            return None
        
        # Extract filename from URL
        parsed = urlparse(url)
        original_filename = os.path.basename(parsed.path)
        
        # Categorize and get standardized filename
        category, standardized_filename = self.categorize_and_standardize(url, original_filename)
        
        # Skip if should be ignored
        if category is None:
            self.stats['ignored'] += 1
            self.logger.debug(f"Ignored: {original_filename}")
            return None
        
        # Check cache using original URL
        url_hash = self.get_url_hash(url)
        if url_hash in self.cache:
            cached_path = self.cache[url_hash]
            if Path(cached_path).exists():
                self.stats['cached'] += 1
                return cached_path
        
        # Create local path with category
        local_path = self.base_dir / category / standardized_filename
        
        # Ensure parent directory exists (for subdirectories like weapons/sword)
        local_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Download with retries
        settings = self.config['download_settings']
        for attempt in range(settings['retry_attempts']):
            try:
                response = self.session.get(
                    url,
                    timeout=settings['timeout_seconds'],
                    stream=True
                )
                response.raise_for_status()
                
                # Check file size
                content_length = response.headers.get('content-length')
                if content_length:
                    size_mb = int(content_length) / (1024 * 1024)
                    max_size = self.config['asset_filters']['max_size_mb']
                    if size_mb > max_size:
                        self.logger.warning(
                            f"Asset too large: {standardized_filename} ({size_mb:.2f}MB)"
                        )
                        return None
                
                # Save to disk
                with open(local_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                
                # Update cache
                self.cache[url_hash] = str(local_path)
                
                # Update category count
                cat_key = category.split('/')[0]  # Use base category for counting
                if cat_key not in self.metadata["categories"]:
                    self.metadata["categories"][cat_key] = 0
                self.metadata["categories"][cat_key] += 1
                self.metadata["total_assets"] = sum(self.metadata["categories"].values())
                
                display_name = standardized_filename
                if standardized_filename != original_filename:
                    display_name = f"{standardized_filename} (was: {original_filename})"
                
                self.logger.info(f"✓ Downloaded: {category}/{display_name}")
                self.stats['downloaded'] += 1
                
                # Rate limiting
                time.sleep(settings['rate_limit_seconds'])
                
                return str(local_path)
                
            except Exception as e:
                if attempt < settings['retry_attempts'] - 1:
                    self.logger.warning(
                        f"Retry {attempt + 1} for {standardized_filename}: {e}"
                    )
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    self.logger.error(f"Failed to download {standardized_filename}: {e}")
                    self.stats['failed'] += 1
                    return None
        
        return None
    
    def is_valid_asset(self, url: str) -> bool:
        """Check if URL matches asset filters"""
        filters = self.config['asset_filters']
        
        # Check extension
        url_lower = url.lower()
        if not any(url_lower.endswith(ext) for ext in filters['extensions']):
            return False
        
        return True
    
    def extract_assets_from_page(self, url: str) -> Set[str]:
        """Extract all asset URLs from a page"""
        assets = set()
        
        try:
            self.logger.info(f"📄 Fetching page: {url}")
            response = self.session.get(
                url, 
                timeout=self.config['download_settings']['timeout_seconds']
            )
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find all image tags
            for img in soup.find_all('img'):
                src = img.get('src')
                if src and '/static/' in src and self.is_valid_asset(src):
                    assets.add(src)
            
            self.logger.info(f"Found {len(assets)} potential assets on page")
            
        except Exception as e:
            self.logger.error(f"Error fetching page {url}: {e}")
        
        return assets
    
    def reorganize_existing_assets(self):
        """
        Reorganize existing assets according to new categorization rules
        Useful for fixing assets from previous downloads
        """
        self.logger.info("🔄 Reorganizing existing assets...")
        
        # Find all assets in all subdirectories
        for root, dirs, files in os.walk(self.base_dir):
            for filename in files:
                if filename in ['asset_cache.json', 'metadata.json']:
                    continue
                
                old_path = Path(root) / filename
                relative_path = old_path.relative_to(self.base_dir)
                
                # Skip if already in correct location
                file_ext = old_path.suffix.lower()
                if file_ext not in self.config['asset_filters']['extensions']:
                    continue
                
                # Determine correct category and filename
                fake_url = f"http://example.com/{filename}"
                category, new_filename = self.categorize_and_standardize(fake_url, filename)
                
                if category is None:
                    # Should be deleted/ignored
                    self.logger.info(f"🗑️  Removing ignored file: {relative_path}")
                    old_path.unlink()
                    self.stats['ignored'] += 1
                    continue
                
                new_path = self.base_dir / category / new_filename
                
                # Skip if already in correct place
                if old_path == new_path:
                    continue
                
                # Ensure target directory exists
                new_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Move file
                try:
                    if new_path.exists():
                        # If target exists, check if they're the same
                        if old_path.stat().st_size == new_path.stat().st_size:
                            self.logger.info(f"Duplicate found, removing: {relative_path}")
                            old_path.unlink()
                        else:
                            self.logger.warning(
                                f"Conflict: {relative_path} -> {new_path.relative_to(self.base_dir)}"
                            )
                    else:
                        old_path.rename(new_path)
                        self.logger.info(
                            f"📦 Moved: {relative_path} -> {new_path.relative_to(self.base_dir)}"
                        )
                        self.stats['reorganized'] += 1
                        
                except Exception as e:
                    self.logger.error(f"Error moving {filename}: {e}")
        
        self.logger.info(f"✓ Reorganization complete. Moved {self.stats['reorganized']} files.")
    
    def download_all_assets(self, parallel: bool = True, reorganize: bool = True):
        """Download all assets from configured pages"""
        print("=" * 70)
        print("Wuthering Waves Asset Manager v3.0")
        print("=" * 70)
        
        # Reorganize existing assets first if requested
        if reorganize:
            self.reorganize_existing_assets()
        
        # Reset download stats (keep reorganize count)
        self.stats.update({
            'downloaded': 0,
            'cached': 0,
            'failed': 0,
            'ignored': 0
        })
        
        all_assets = set()
        
        # Collect assets from all pages
        for category, page_path in self.config['pages'].items():
            url = urljoin(self.base_url, page_path)
            assets = self.extract_assets_from_page(url)
            all_assets.update(assets)
        
        self.logger.info(f"📊 Total unique assets found: {len(all_assets)}")
        self.logger.info("🔽 Starting downloads...")
        
        # Download assets
        if parallel and len(all_assets) > 10:
            self._parallel_download(all_assets)
        else:
            self._sequential_download(all_assets)
        
        # Clean up empty directories
        self._cleanup_empty_dirs()
        
        # Save cache and metadata
        self.save_cache()
        self.save_metadata()
        
        # Print summary
        self._print_summary()
    
    def _sequential_download(self, assets: Set[str]):
        """Download assets sequentially"""
        for asset_url in assets:
            self.download_asset(asset_url)
    
    def _parallel_download(self, assets: Set[str]):
        """Download assets in parallel"""
        max_workers = self.config['download_settings'].get('parallel_downloads', 5)
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(self.download_asset, url): url for url in assets}
            
            for future in as_completed(futures):
                try:
                    future.result()
                except Exception as e:
                    self.logger.error(f"Download error: {e}")
    
    def _cleanup_empty_dirs(self):
        """Remove empty directories"""
        for root, dirs, files in os.walk(self.base_dir, topdown=False):
            for dir_name in dirs:
                dir_path = Path(root) / dir_name
                try:
                    if not any(dir_path.iterdir()):
                        dir_path.rmdir()
                        self.logger.debug(f"Removed empty directory: {dir_path}")
                except OSError:
                    pass
    
    def _print_summary(self):
        """Print download summary"""
        print("\n" + "=" * 70)
        print("📊 Download Summary")
        print("=" * 70)
        print(f"New downloads:    {self.stats['downloaded']}")
        print(f"From cache:       {self.stats['cached']}")
        print(f"Failed:           {self.stats['failed']}")
        print(f"Ignored:          {self.stats['ignored']}")
        if self.stats['reorganized'] > 0:
            print(f"Reorganized:      {self.stats['reorganized']}")
        print(f"\nTotal assets:     {self.metadata['total_assets']}")
        print(f"\nAssets by category:")
        for cat, count in sorted(self.metadata["categories"].items()):
            print(f"  {cat:15s}: {count:4d}")
        print(f"\nAssets saved to: {self.base_dir.absolute()}")
        print("=" * 70)
    
    def cleanup_cache(self):
        """Remove cached entries for missing files"""
        removed = 0
        for url_hash, path in list(self.cache.items()):
            if not Path(path).exists():
                del self.cache[url_hash]
                removed += 1
        
        if removed > 0:
            self.logger.info(f"Removed {removed} stale cache entries")
            self.save_cache()
    
    def get_asset_info(self):
        """Display information about cached assets"""
        print("\n" + "=" * 70)
        print("📊 Asset Cache Information")
        print("=" * 70)
        print(f"Last update: {self.metadata.get('last_update', 'Never')}")
        print(f"Total assets: {self.metadata['total_assets']}")
        print(f"\nAssets by category:")
        for cat, count in sorted(self.metadata["categories"].items()):
            print(f"  {cat:15s}: {count:4d}")
        
        if self.metadata.get('history'):
            print(f"\nRecent updates:")
            for entry in self.metadata['history'][-5:]:
                ts = entry['timestamp'][:19]  # Trim milliseconds
                print(f"  {ts}: {entry['downloaded']} new, "
                      f"{entry['cached']} cached, {entry['ignored']} ignored")
        
        print(f"\nCache location: {self.base_dir.absolute()}")
        print("=" * 70)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Wuthering Waves Asset Manager v3.0 - Unified asset management tool',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Download all assets
  python ww_asset_manager.py
  
  # Download for Tauri prebuild
  python ww_asset_manager.py --prebuild
  
  # Reorganize existing assets without downloading
  python ww_asset_manager.py --reorganize-only
  
  # Show cache info
  python ww_asset_manager.py --info
  
  # Clean up stale cache entries
  python ww_asset_manager.py --cleanup
        """
    )
    
    parser.add_argument(
        '--config',
        help='Path to configuration file (JSON)'
    )
    parser.add_argument(
        '--dir',
        help='Base directory for assets (default: ./ww_assets)'
    )
    parser.add_argument(
        '--prebuild',
        action='store_true',
        help='Prebuild mode: download to src-tauri/resources/assets for bundling'
    )
    parser.add_argument(
        '--update',
        action='store_true',
        help='Update existing assets (default behavior)'
    )
    parser.add_argument(
        '--reorganize-only',
        action='store_true',
        help='Only reorganize existing assets, do not download new ones'
    )
    parser.add_argument(
        '--info',
        action='store_true',
        help='Show information about cached assets'
    )
    parser.add_argument(
        '--cleanup',
        action='store_true',
        help='Clean up stale cache entries'
    )
    parser.add_argument(
        '--sequential',
        action='store_true',
        help='Disable parallel downloads (slower but more stable)'
    )
    parser.add_argument(
        '--no-reorganize',
        action='store_true',
        help='Skip reorganizing existing assets before download'
    )
    
    args = parser.parse_args()
    
    # Create manager instance
    manager = WWAssetManager(
        config_file=args.config,
        base_dir=args.dir,
        prebuild_mode=args.prebuild
    )
    
    # Execute requested action
    if args.cleanup:
        manager.cleanup_cache()
    elif args.info:
        manager.get_asset_info()
    elif args.reorganize_only:
        print("=" * 70)
        print("Reorganizing existing assets only (no downloads)")
        print("=" * 70)
        manager.reorganize_existing_assets()
        manager.save_metadata()
        manager._print_summary()
    else:
        # Normal download mode
        manager.download_all_assets(
            parallel=not args.sequential,
            reorganize=not args.no_reorganize
        )


if __name__ == "__main__":
    main()
