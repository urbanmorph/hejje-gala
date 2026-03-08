#!/usr/bin/env python3
"""
Script to upload files to Cloudflare R2 bucket and update index.json

Usage:
    python upload_to_r2.py --file path/to/image.jpg --type image --alt "Description" --social-url "https://instagram.com/p/..." --author "username"
    python upload_to_r2.py --file path/to/video.mp4 --type video --alt "Description" --thumbnail path/to/thumb.jpg --social-url "https://instagram.com/p/..." --author "username"
    python upload_to_r2.py --directory path/to/assets/ --type image
    python upload_to_r2.py --list  # List all assets in index.json
    python upload_to_r2.py --remove image.jpg  # Remove an asset from index.json
    python upload_to_r2.py --update-keys  # Update item keys for all existing files
"""

import argparse
import json
import os
import sys
import secrets
import string
from pathlib import Path
from typing import Optional
import mimetypes

try:
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError
except ImportError:
    print("Error: boto3 is required. Install it with: pip install boto3")
    sys.exit(1)


# R2 Configuration
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "")
R2_BUCKET_NAME = "hejje-gala-assets"
R2_ENDPOINT_URL = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

# Asset type detection
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".avi", ".mkv"}


def generate_item_key(file_path: str) -> str:
    """Generate an 8-character alphanumeric key with file extension."""
    file_path_obj = Path(file_path)
    extension = file_path_obj.suffix.lower()
    # Generate 8-character alphanumeric string
    alphabet = string.ascii_letters + string.digits
    random_part = ''.join(secrets.choice(alphabet) for _ in range(8))
    return f"{random_part}{extension}"


def get_r2_client():
    """Create and return an R2 (S3-compatible) client."""
    if not all([R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY]):
        print("Error: R2 credentials not set. Please set the following environment variables:")
        print("  - R2_ACCOUNT_ID")
        print("  - R2_ACCESS_KEY_ID")
        print("  - R2_SECRET_ACCESS_KEY")
        sys.exit(1)

    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )


def detect_asset_type(file_path: str) -> str:
    """Detect asset type from file extension."""
    ext = Path(file_path).suffix.lower()
    if ext in IMAGE_EXTENSIONS:
        return "image"
    elif ext in VIDEO_EXTENSIONS:
        return "video"
    else:
        return "image"  # Default to image


def get_content_type(file_path: str) -> str:
    """Get content type for file."""
    content_type, _ = mimetypes.guess_type(file_path)
    if content_type:
        return content_type
    # Fallback content types
    ext = Path(file_path).suffix.lower()
    if ext in IMAGE_EXTENSIONS:
        return "image/jpeg" if ext in {".jpg", ".jpeg"} else f"image/{ext[1:]}"
    elif ext in VIDEO_EXTENSIONS:
        return f"video/{ext[1:]}"
    return "application/octet-stream"


def upload_file_to_r2(
    client, file_path: str, object_key: Optional[str] = None
) -> str:
    """Upload a file to R2 bucket."""
    file_path_obj = Path(file_path)
    if not file_path_obj.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    # Use provided key, generate new key, or use filename
    if object_key is None:
        object_key = generate_item_key(file_path)

    print(f"Uploading {file_path} to R2 as {object_key}...")

    try:
        client.upload_file(
            file_path,
            R2_BUCKET_NAME,
            object_key,
            ExtraArgs={"ContentType": get_content_type(file_path)},
        )
        print(f"✓ Successfully uploaded {object_key}")
        return object_key
    except ClientError as e:
        print(f"✗ Error uploading {object_key}: {e}")
        raise


def get_index_json(client) -> dict:
    """Fetch and parse index.json from R2 at social/index.json."""
    try:
        response = client.get_object(Bucket=R2_BUCKET_NAME, Key="social/index.json")
        content = response["Body"].read().decode("utf-8")
        return json.loads(content)
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            print("social/index.json not found, creating new one...")
            return {"assets": []}
        else:
            print(f"Error fetching social/index.json: {e}")
            raise


def update_index_json(client, index_data: dict):
    """Upload updated index.json to R2 at social/index.json."""
    json_str = json.dumps(index_data, indent=2, ensure_ascii=False)
    print("\nUpdating social/index.json...")

    try:
        client.put_object(
            Bucket=R2_BUCKET_NAME,
            Key="social/index.json",
            Body=json_str.encode("utf-8"),
            ContentType="application/json",
        )
        print("✓ Successfully updated social/index.json")
    except ClientError as e:
        print(f"✗ Error updating social/index.json: {e}")
        raise


def add_asset_to_index(
    client,
    file_path: str,
    asset_type: Optional[str] = None,
    alt: Optional[str] = None,
    thumbnail: Optional[str] = None,
    object_key: Optional[str] = None,
    social_url: Optional[str] = None,
    author: Optional[str] = None,
):
    """Upload a file and add it to index.json."""
    # Upload the file
    uploaded_key = upload_file_to_r2(client, file_path, object_key)

    # Detect type if not provided
    if asset_type is None:
        asset_type = detect_asset_type(file_path)

    # Upload thumbnail if provided
    thumbnail_key = None
    if thumbnail:
        thumbnail_key = upload_file_to_r2(client, thumbnail, None)

    # Get current index
    index_data = get_index_json(client)

    # Check if asset already exists
    existing_index = next(
        (i for i, asset in enumerate(index_data["assets"]) if asset["url"] == uploaded_key),
        None,
    )

    # Create asset entry
    asset_entry = {
        "url": uploaded_key,
        "type": asset_type,
    }
    if alt:
        asset_entry["alt"] = alt
    if thumbnail_key:
        asset_entry["thumbnail"] = thumbnail_key
    if social_url:
        asset_entry["socialUrl"] = social_url
    if author:
        asset_entry["author"] = author

    # Add or update asset
    if existing_index is not None:
        print(f"Updating existing asset entry for {uploaded_key}")
        index_data["assets"][existing_index] = asset_entry
    else:
        print(f"Adding new asset entry for {uploaded_key}")
        index_data["assets"].append(asset_entry)

    # Update index.json
    update_index_json(client, index_data)
    print(f"\n✓ Successfully added {uploaded_key} to index.json")


def remove_asset_from_index(client, object_key: str):
    """Remove an asset from index.json."""
    index_data = get_index_json(client)

    # Find and remove asset
    original_count = len(index_data["assets"])
    index_data["assets"] = [
        asset for asset in index_data["assets"] if asset["url"] != object_key
    ]

    if len(index_data["assets"]) == original_count:
        print(f"✗ Asset {object_key} not found in index.json")
        return

    # Update index.json
    update_index_json(client, index_data)
    print(f"✓ Successfully removed {object_key} from index.json")


def list_assets(client):
    """List all assets in index.json."""
    index_data = get_index_json(client)
    assets = index_data.get("assets", [])

    if not assets:
        print("No assets found in index.json")
        return

    print(f"\nFound {len(assets)} asset(s) in index.json:\n")
    for i, asset in enumerate(assets, 1):
        print(f"{i}. {asset['url']} ({asset['type']})")
        if asset.get("alt"):
            print(f"   Alt: {asset['alt']}")
        if asset.get("thumbnail"):
            print(f"   Thumbnail: {asset['thumbnail']}")
        if asset.get("socialUrl"):
            print(f"   Social URL: {asset['socialUrl']}")
        if asset.get("author"):
            print(f"   Author: {asset['author']}")
        print()


def upload_directory(client, directory: str, asset_type: Optional[str] = None):
    """Upload all files from a directory."""
    dir_path = Path(directory)
    if not dir_path.is_dir():
        print(f"Error: {directory} is not a directory")
        return

    files = [
        f
        for f in dir_path.iterdir()
        if f.is_file() and f.suffix.lower() in (IMAGE_EXTENSIONS | VIDEO_EXTENSIONS)
    ]

    if not files:
        print(f"No image or video files found in {directory}")
        return

    print(f"Found {len(files)} file(s) to upload\n")

    for file_path in files:
        try:
            detected_type = detect_asset_type(str(file_path))
            final_type = asset_type or detected_type
            add_asset_to_index(client, str(file_path), asset_type=final_type)
            print()
        except Exception as e:
            print(f"✗ Error processing {file_path}: {e}\n")
            continue

    print("✓ Directory upload complete")


def update_all_item_keys(client):
    """Update item keys for all asset files (images and videos) in the R2 bucket under social/. JSON files are excluded."""
    # Get all objects in the bucket
    print("Fetching all objects from R2 bucket...")
    all_objects = []
    paginator = client.get_paginator('list_objects_v2')
    
    for page in paginator.paginate(Bucket=R2_BUCKET_NAME, Prefix='social/'):
        if 'Contents' in page:
            all_objects.extend(page['Contents'])
    
    # Filter to only include asset files (images and videos), exclude JSON files
    file_keys = []
    for obj in all_objects:
        key = obj['Key']
        # Skip index.json and any JSON files
        if key == 'social/index.json' or key.lower().endswith('.json'):
            continue
        # Only include image and video files under social/ prefix
        if not key.startswith('social/'):
            continue
        ext = Path(key).suffix.lower()
        if ext in (IMAGE_EXTENSIONS | VIDEO_EXTENSIONS):
            file_keys.append(key)
    
    if not file_keys:
        print("No asset files found in R2 bucket to update")
        return
    
    print(f"Found {len(file_keys)} asset file(s) in R2 bucket to update\n")
    
    # Get index.json to track which files need their references updated
    index_data = get_index_json(client)
    assets = index_data.get("assets", [])
    
    # Create a mapping of old keys to new keys
    key_mapping = {}
    updated_count = 0
    
    # Process each file
    for i, old_key in enumerate(file_keys, 1):
        # Generate new key based on old key's extension (generate_item_key already includes social/ prefix)
        new_key = generate_item_key(old_key)
        
        # Ensure uniqueness (in case of collision, though very unlikely)
        while new_key in key_mapping.values() or new_key in file_keys:
            new_key = generate_item_key(old_key)
        
        key_mapping[old_key] = new_key
        print(f"{i}. Updating {old_key} -> {new_key}")
        
        try:
            # Copy file to new key
            copy_source = {"Bucket": R2_BUCKET_NAME, "Key": old_key}
            client.copy_object(
                CopySource=copy_source,
                Bucket=R2_BUCKET_NAME,
                Key=new_key,
            )
            print(f"   ✓ Copied to {new_key}")
            
            # Delete old file
            client.delete_object(Bucket=R2_BUCKET_NAME, Key=old_key)
            print(f"   ✓ Deleted old key {old_key}")
            updated_count += 1
            print()
            
        except ClientError as e:
            print(f"   ✗ Error updating {old_key}: {e}\n")
            continue
    
    # Update index.json with new keys
    if updated_count > 0 and assets:
        print("Updating references in index.json...")
        for asset in assets:
            # Update main URL
            if asset["url"] in key_mapping:
                asset["url"] = key_mapping[asset["url"]]
            
            # Update thumbnail if it exists
            if asset.get("thumbnail") and asset["thumbnail"] in key_mapping:
                asset["thumbnail"] = key_mapping[asset["thumbnail"]]
        
        update_index_json(client, index_data)
        print("✓ Successfully updated index.json with new keys")
    
    if updated_count > 0:
        print(f"\n✓ Successfully updated {updated_count} file(s) in R2 bucket")
    else:
        print("\n✗ No files were updated")


def main():
    parser = argparse.ArgumentParser(
        description="Upload files to Cloudflare R2 and update index.json"
    )
    parser.add_argument(
        "--file",
        type=str,
        help="Path to file to upload",
    )
    parser.add_argument(
        "--directory",
        type=str,
        help="Path to directory containing files to upload",
    )
    parser.add_argument(
        "--type",
        type=str,
        choices=["image", "video"],
        help="Asset type (image or video). Auto-detected if not provided.",
    )
    parser.add_argument(
        "--alt",
        type=str,
        help="Alt text/description for the asset",
    )
    parser.add_argument(
        "--thumbnail",
        type=str,
        help="Path to thumbnail image (for videos)",
    )
    parser.add_argument(
        "--key",
        type=str,
        help="Custom object key in R2 (defaults to filename)",
    )
    parser.add_argument(
        "--social-url",
        type=str,
        help="Social URL (link to original post on Instagram)",
    )
    parser.add_argument(
        "--author",
        type=str,
        help="Author (Username of original author on Instagram)",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List all assets in index.json",
    )
    parser.add_argument(
        "--remove",
        type=str,
        help="Remove an asset from index.json by object key",
    )
    parser.add_argument(
        "--update-keys",
        action="store_true",
        help="Update item keys for all existing files in index.json",
    )

    args = parser.parse_args()

    # Validate arguments
    if not any([args.file, args.directory, args.list, args.remove, args.update_keys]):
        parser.print_help()
        sys.exit(1)

    try:
        client = get_r2_client()

        if args.list:
            list_assets(client)
        elif args.remove:
            remove_asset_from_index(client, args.remove)
        elif args.update_keys:
            update_all_item_keys(client)
        elif args.directory:
            upload_directory(client, args.directory, args.type)
        elif args.file:
            add_asset_to_index(
                client,
                args.file,
                asset_type=args.type,
                alt=args.alt,
                thumbnail=args.thumbnail,
                object_key=args.key,
                social_url=args.social_url,
                author=args.author,
            )
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

