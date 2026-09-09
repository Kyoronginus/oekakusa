use std::fs::File;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use image::{Frame, Delay};
use image::codecs::gif::GifEncoder;
use std::time::Duration;

#[tauri::command]
pub fn export_gif(app: AppHandle, image_paths: Vec<String>, output_path: Option<String>) -> Result<String, String> {
    let target_path: PathBuf;

    if let Some(path) = output_path {
        target_path = PathBuf::from(path);
    } else {
        target_path = app.path().resolve("gifs", tauri::path::BaseDirectory::AppData)
            .map_err(|e| format!("Failed to resolve output dir: {}", e))?;
    }

    if !target_path.exists() {
        let _ = std::fs::create_dir_all(&target_path);
    }

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    
    // Check if output_path was just a directory or a file.
    let final_output_path = if target_path.extension().and_then(|s| s.to_str()) == Some("gif") {
        target_path
    } else {
        target_path.join(format!("oekakusa_{}.gif", timestamp))
    };

    let file_out = File::create(&final_output_path).map_err(|e| format!("Failed to create output file: {}", e))?;
    let mut encoder = GifEncoder::new(file_out);
    
    // Set repeat to Infinite.
    let _ = encoder.set_repeat(image::codecs::gif::Repeat::Infinite);

    for path_str in image_paths {
        let path = std::path::Path::new(&path_str);
        
        let mut img_result = image::open(path);

        // Fallback: If file not found, try appending "_full" to filename (legacy/mismatch handling)
        if img_result.is_err() {
             if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                 if let Some(parent) = path.parent() {
                     if !stem.ends_with("_full") {
                         let new_filename = format!("{}_full.png", stem);
                         let new_path = parent.join(new_filename);
                         if new_path.exists() {
                             // println!("Fallback: Found image at {:?}", new_path);
                             img_result = image::open(new_path);
                         }
                     }
                 }
             }
        }

        let img = match img_result {
            Ok(i) => i,
            Err(e) => {
                println!("Failed to open image for GIF (skipping): {} - Error: {}", path_str, e);
                continue;
            }
        };
        
        // RESIZE: Scaling down to max 1200px width massively speeds up GIF encoding
        let resized = img.resize(1200, 1200, image::imageops::FilterType::Triangle);  
        let rgba_img = resized.into_rgba8();
        
        // gif delay is 500ms
        let frame = Frame::from_parts(rgba_img, 0, 0, Delay::from_saturating_duration(Duration::from_millis(500)));
        
        encoder.encode_frame(frame).map_err(|e| format!("Failed to encode frame: {}", e))?;
    }

    let final_output_str = final_output_path.to_string_lossy().to_string();
    Ok(final_output_str)
}
