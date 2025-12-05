use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager, State};

struct WatcherState {
    watcher: Mutex<Option<RecommendedWatcher>>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn update_watch_paths(
    app: AppHandle,
    state: State<'_, WatcherState>,
    paths: Vec<String>,
) -> Result<(), String> {
    let mut watcher_guard = state.watcher.lock().map_err(|e| e.to_string())?;

    // Reset watcher (stop monitoring old paths)
    if watcher_guard.is_some() {
        *watcher_guard = None;
    }

    if paths.is_empty() {
        return Ok(());
    }

    let app_handle = app.clone();
    let (tx, rx) = std::sync::mpsc::channel();
    let mut watcher = RecommendedWatcher::new(tx, Config::default()).map_err(|e| e.to_string())?;

    for path_str in paths {
        let path = PathBuf::from(path_str);
        if path.exists() {
             let _ = watcher.watch(&path, RecursiveMode::Recursive);
        }
    }

    *watcher_guard = Some(watcher);

    std::thread::spawn(move || {
        let mut last_processed: HashMap<PathBuf, Instant> = HashMap::new();

        for res in rx {
            match res {
                Ok(event) => {
                    for path in event.paths {
                        if path.extension().and_then(|s| s.to_str()) == Some("clip") {
                            // Debounce: 5 seconds
                            let now = Instant::now();
                            if let Some(last_time) = last_processed.get(&path) {
                                if now.duration_since(*last_time) < Duration::from_secs(5) {
                                    continue;
                                }
                            }
                            last_processed.insert(path.clone(), now);

                            println!("Detected change in: {:?}", path);

                            let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
                            let python_script = manifest_dir.join("../../python/extract_thumb.py");
                            let output_dir = manifest_dir.join("../../thumbnails");

                            if !output_dir.exists() {
                                let _ = fs::create_dir_all(&output_dir);
                            }

                            // Execute Python script
                            let output = Command::new("python")
                                .arg(&python_script)
                                .arg(&path)
                                .arg(&output_dir)
                                .output();

                            match output {
                                Ok(o) => {
                                    if o.status.success() {
                                        let stdout = String::from_utf8_lossy(&o.stdout);
                                        println!("Python output: {}", stdout);

                                        if let Ok(json) =
                                            serde_json::from_str::<serde_json::Value>(&stdout)
                                        {
                                            if json["status"] == "success" {
                                                let _ =
                                                    app_handle.emit("thumbnail-generated", &json);
                                            }
                                        }
                                    } else {
                                        let stderr = String::from_utf8_lossy(&o.stderr);
                                        println!("Python error: {}", stderr);
                                    }
                                }
                                Err(e) => {
                                    println!("Failed to execute python: {}", e);
                                }
                            }
                        }
                    }
                }
                Err(e) => println!("watch error: {:?}", e),
            }
        }
    });

    Ok(())
}

#[tauri::command]
fn export_gif(image_paths: Vec<String>) -> Result<String, String> {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let python_script = manifest_dir.join("../../python/create_gif.py");
    let output_dir = manifest_dir.join("../../gifs");

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(WatcherState {
            watcher: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![greet, update_watch_paths, export_gif])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
