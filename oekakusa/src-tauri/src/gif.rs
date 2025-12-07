use std::fs;
use std::process::Command;
use tauri::{AppHandle, Manager};

#[tauri::command]
pub fn export_gif(app: AppHandle, image_paths: Vec<String>) -> Result<String, String> {
    let python_script = app.path().resolve("python/create_gif.py", tauri::path::BaseDirectory::Resource)
        .map_err(|e| format!("Failed to resolve python script: {}", e))?;
    
    let output_dir = app.path().resolve("gifs", tauri::path::BaseDirectory::AppData)
        .map_err(|e| format!("Failed to resolve output dir: {}", e))?;

    if !output_dir.exists() {
        let _ = fs::create_dir_all(&output_dir);
    }

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let output_path = output_dir.join(format!("progress_{}.gif", timestamp));
    let output_path_str = output_path.to_string_lossy().to_string();

    let image_paths_json = serde_json::to_string(&image_paths).map_err(|e| e.to_string())?;

    let output = Command::new("python")
        .arg(&python_script)
        .arg(&output_path_str)
        .arg(&image_paths_json)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&stdout) {
            if json["status"] == "success" {
                return Ok(output_path_str);
            } else {
                return Err(json["message"]
                    .as_str()
                    .unwrap_or("Unknown error")
                    .to_string());
            }
        }
        Ok(output_path_str) // Fallback
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Python error: {}", stderr))
    }
}
