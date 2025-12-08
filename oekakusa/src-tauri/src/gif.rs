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
        let img = image::open(&path_str).map_err(|e| format!("Failed to open {}: {}", path_str, e))?;
        
        let rgba_img = img.into_rgba8();
        
        // Delay is 500ms
        let frame = Frame::from_parts(rgba_img, 0, 0, Delay::from_saturating_duration(Duration::from_millis(500)));
        
        encoder.encode_frame(frame).map_err(|e| format!("Failed to encode frame: {}", e))?;
    }

    let final_output_str = final_output_path.to_string_lossy().to_string();
    Ok(final_output_str)
}
