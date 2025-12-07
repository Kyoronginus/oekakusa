use std::fs;
use std::process::Command;
use tauri::{AppHandle, Manager};

#[tauri::command]
pub fn export_gif(app: AppHandle, image_paths: Vec<String>, output_path: Option<String>) -> Result<String, String> {
    let python_script = app.path().resolve("python/create_gif.py", tauri::path::BaseDirectory::Resource)
        .map_err(|e| format!("Failed to resolve python script: {}", e))?;
    
    let target_path: std::path::PathBuf;

    if let Some(path) = output_path {
        // Use provided path logic
        // If path is a directory, append filename. If it looks like a file, use it.
        // For simplicity, let's assume the frontend passes a directory or we just use it as a base.
        // Actually, let's rely on the frontend to pass the DIRECTORY, and we append the filename here, 
        // OR the frontend passes the full filename. 
        // Task Description says: "If exportPath is set, construct a target filename: ${exportPath}/oekakusa_${timestamp}.gif" in Frontend.
        // But passing just the folder from Settings is easier, and let Rust handle filename?
        // Let's stick to: Frontend passes optional `output_dir`. Rust constructs filename inside it.
        // Wait, the plan said "Invoke export_gif with this path." 
        // If the frontend constructs the full path, it's flexible.
        // Let's assume `output_path` is the export DIRECTORY from settings. 
        // We will generate the filename standardly.
        
        target_path = std::path::PathBuf::from(path);
    } else {
        // Default
        target_path = app.path().resolve("gifs", tauri::path::BaseDirectory::AppData)
            .map_err(|e| format!("Failed to resolve output dir: {}", e))?;
    }

    if !target_path.exists() {
        let _ = fs::create_dir_all(&target_path);
    }

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    
    let final_output = target_path.join(format!("oekakusa_{}.gif", timestamp));
    let final_output_str = final_output.to_string_lossy().to_string();

    let image_paths_json = serde_json::to_string(&image_paths).map_err(|e| e.to_string())?;

    let output = Command::new("python")
        .arg(&python_script)
        .arg(&final_output_str)
        .arg(&image_paths_json)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&stdout) {
            if json["status"] == "success" {
                return Ok(final_output_str);
            } else {
                return Err(json["message"]
                    .as_str()
                    .unwrap_or("Unknown error")
                    .to_string());
            }
        }
        Ok(final_output_str) 
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Python error: {}", stderr))
    }
}
