use rusqlite::Connection;
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::Path;
use image::ImageFormat;
use tempfile::NamedTempFile;

#[derive(Debug, serde::Serialize, Clone)]
pub struct ThumbnailResult {
    pub status: String,
    pub original_file: String,
    pub thumbnail_path: String,
    pub timestamp: i64,
    pub message: Option<String>,
}

pub fn extract_thumbnail(clip_path: &Path, output_dir: &Path) -> Result<ThumbnailResult, String> {
    if !clip_path.exists() {
        return Err("Input file not found".to_string());
    }
    if !output_dir.exists() {
        fs::create_dir_all(output_dir).map_err(|e| e.to_string())?;
    }

    // 2. Read file and find SQLite header
    // The header is "SQLite format 3\0" which is 16 bytes.
    let sqlite_header = b"SQLite format 3\0";
    let mut file = File::open(clip_path).map_err(|e| e.to_string())?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;

    let offset = buffer
        .windows(sqlite_header.len())
        .position(|window| window == sqlite_header)
        .ok_or("SQLite header not found in .clip file")?;

    // 3. Write embedded DB to temp file
    let mut temp_db = NamedTempFile::new().map_err(|e| e.to_string())?;
    temp_db.write_all(&buffer[offset..]).map_err(|e| e.to_string())?;
    let temp_db_path = temp_db.path().to_owned();

    // 4. Extract Image Blob
    let conn = Connection::open(&temp_db_path).map_err(|e| e.to_string())?;
    
    let tables = ["CanvasPreview", "Thumbnail", "PreviewImage"];
    let mut image_data: Option<Vec<u8>> = None;

    for table in tables {
        let query = format!("SELECT * FROM {} LIMIT 1", table);
        let mut stmt = match conn.prepare(&query) {
            Ok(s) => s,
            Err(_) => continue, // Table might not exist
        };

        let column_count = stmt.column_count();
        
        let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
        
        if let Ok(Some(row)) = rows.next() {
            for i in 0..column_count {
                if let Ok(blob) = row.get::<_, Vec<u8>>(i) {
                     // Heuristic: Thumbnail must be reasonably large (> 100 bytes)
                     if blob.len() > 100 {
                         image_data = Some(blob);
                         break;
                     }
                }
            }
        }

        if image_data.is_some() {
            break;
        }
    }

    drop(conn); 

    let data = image_data.ok_or("No thumbnail data found in any known tables")?;

    // 5. Save Image
    let timestamp = chrono::Utc::now().timestamp();
    let file_stem = clip_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("unknown");
        
    let output_filename = format!("{}_{}.png", file_stem, timestamp);
    let output_path = output_dir.join(&output_filename);

    let img = image::load_from_memory(&data).map_err(|e| format!("Failed to decode image: {}", e))?;
    img.save_with_format(&output_path, ImageFormat::Png)
        .map_err(|e| format!("Failed to save thumbnail: {}", e))?;

    Ok(ThumbnailResult {
        status: "success".to_string(),
        original_file: clip_path.to_string_lossy().to_string(),
        thumbnail_path: output_path.to_string_lossy().to_string(),
        timestamp,
        message: None,
    })
}
