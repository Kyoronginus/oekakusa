use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager, State};

pub struct WatcherState {
    pub watcher: Mutex<Option<RecommendedWatcher>>,
}

#[tauri::command]
pub fn update_watch_paths(
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

                            let python_script = match app_handle.path().resolve("python/extract_thumb.py", tauri::path::BaseDirectory::Resource) {
                                Ok(p) => p,
                                Err(e) => {
                                    println!("Failed to resolve python script: {}", e);
                                    continue;
                                }
                            };
                            let output_dir = match app_handle.path().resolve("thumbnails", tauri::path::BaseDirectory::AppData) {
                                Ok(p) => p,
                                Err(e) => {
                                    println!("Failed to resolve output dir: {}", e);
                                    PathBuf::from("thumbnails") // Fallback
                                }
                            };

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

                                        if let Ok(mut json) =
                                            serde_json::from_str::<serde_json::Value>(&stdout)
                                        {
                                            if json["status"] == "success" {
                                                // Canonicalize path to remove ../ which Tauri fs plugin rejects
                                                if let Some(path_str) =
                                                    json["thumbnail_path"].as_str()
                                                {
                                                    if let Ok(canon_path) =
                                                        fs::canonicalize(path_str)
                                                    {
                                                        // Remove UNC prefix on Windows (\\?\)
                                                        let mut clean_path = canon_path
                                                            .to_string_lossy()
                                                            .to_string();
                                                        if clean_path.starts_with("\\\\?\\") {
                                                            clean_path =
                                                                clean_path[4..].to_string();
                                                        }
                                                        json["thumbnail_path"] =
                                                            serde_json::Value::String(clean_path);
                                                    }
                                                }

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
