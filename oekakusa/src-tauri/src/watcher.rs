use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager, State};

pub struct WatcherState {
    pub watcher: Mutex<Option<RecommendedWatcher>>,
    pub active_config: Mutex<Option<(Vec<String>, u64)>>,
}

#[tauri::command]
pub fn update_watch_paths(
    app: AppHandle,
    state: State<'_, WatcherState>,
    paths: Vec<String>,
    interval: u64,
) -> Result<(), String> {
    let mut config_guard = state.active_config.lock().map_err(|e| e.to_string())?;
    
    // Check if configuration has changed
    if let Some((current_paths, current_interval)) = &*config_guard {
        if *current_paths == paths && *current_interval == interval {
            println!("Watcher configuration unchanged. Skipping update.");
            return Ok(());
        }
    }

    let mut watcher_guard = state.watcher.lock().map_err(|e| e.to_string())?;

    // Reset watcher (stop monitoring old paths)
    if watcher_guard.is_some() {
        println!("Stopping previous watcher...");
        *watcher_guard = None;
    }

    if paths.is_empty() {
        *config_guard = None;
        return Ok(());
    }

    // Update active config
    *config_guard = Some((paths.clone(), interval));

    let app_handle = app.clone();
    let (tx, rx) = std::sync::mpsc::channel();
    let mut watcher = RecommendedWatcher::new(tx, Config::default()).map_err(|e| e.to_string())?;

    for path_str in &paths {
        let path = PathBuf::from(path_str);
        if path.exists() {
            let _ = watcher.watch(&path, RecursiveMode::Recursive);
        }
    }

    *watcher_guard = Some(watcher);
    println!("Watcher started with interval: {}s", interval);

    let debounce_duration = Duration::from_secs(interval);

    std::thread::spawn(move || {
        // Use String as key to ensure we compare normalized paths
        let mut last_processed: HashMap<String, Instant> = HashMap::new();

        println!("Watcher thread started.");

        for res in rx {
            match res {
                Ok(event) => {
                    for raw_path in event.paths {
                        if raw_path.extension().and_then(|s| s.to_str()) == Some("clip") {
                            
                            // 1. Canonicalize to resolve symlinks/relative paths if possible
                            let canonical_path = match fs::canonicalize(&raw_path) {
                                Ok(p) => p,
                                Err(_) => raw_path.clone(),
                            };

                            // 2. Normalize to string and strip Windows UNC prefix for consistent key
                            let mut path_key = canonical_path.to_string_lossy().to_string();
                            if path_key.starts_with("\\\\?\\") {
                                path_key = path_key[4..].to_string();
                            }

                            // 3. Debounce check using the normalized key
                            let now = Instant::now();
                            if let Some(last_time) = last_processed.get(&path_key) {
                                if now.duration_since(*last_time) < debounce_duration {
                                    println!("Debouncing event for: {}", path_key);
                                    continue;
                                }
                            }
                            last_processed.insert(path_key.clone(), now);

                            println!("Processing change for: {}", path_key);

                            let output_dir = match app_handle.path().resolve("thumbnails", tauri::path::BaseDirectory::AppData) {
                                Ok(p) => p,
                                Err(e) => {
                                    println!("Failed to resolve output dir: {}", e);
                                    PathBuf::from("thumbnails")
                                }
                            };

                            if !output_dir.exists() {
                                let _ = fs::create_dir_all(&output_dir);
                            }

                            // Execute Native Rust Thumbnail Extraction
                            let thumb_result = crate::thumbnail::extract_thumbnail(&canonical_path, &output_dir);

                            match thumb_result {
                                Ok(res) => {
                                    println!("Thumbnail extracted: {:?}", res);
                                    if let Err(e) = app_handle.emit("thumbnail-generated", res) {
                                         println!("Failed to emit event: {}", e);
                                    }
                                }
                                Err(e) => {
                                    println!("Thumbnail extraction failed: {}", e);
                                }
                            }
                        }
                    }
                }
                Err(e) => println!("watch error: {:?}", e),
            }
        }
        println!("Watcher thread stopped.");
    });

    Ok(())
}