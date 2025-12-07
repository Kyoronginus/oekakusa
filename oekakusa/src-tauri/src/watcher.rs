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

fn resolve_resource_paths(app_handle: &AppHandle) -> Option<(PathBuf, PathBuf)> {
    let python_script = app_handle
        .path()
        .resolve(
            "python/extract_thumb.py",
            tauri::path::BaseDirectory::Resource,
        )
        .map_err(|e| {
            println!("Failed to resolve python script: {}", e);
            e
        })
        .ok()?;

    let output_dir = app_handle
        .path()
        .resolve("thumbnails", tauri::path::BaseDirectory::AppData)
        .unwrap_or_else(|e| {
            println!("Failed to resolve output dir: {}, using fallback", e);
            PathBuf::from("thumbnails")
        });

    if !output_dir.exists() {
        let _ = fs::create_dir_all(&output_dir);
    }

    Some((python_script, output_dir))
}

fn clean_windows_path(path: PathBuf) -> String {
    let mut clean_path = path.to_string_lossy().to_string();
    if clean_path.starts_with("\\\\?\\") {
        clean_path = clean_path[4..].to_string();
    }
    clean_path
}

fn run_extraction(
    python_script: &PathBuf,
    path: &PathBuf,
    output_dir: &PathBuf,
) -> Option<serde_json::Value> {
    let output = Command::new("python")
        .arg(python_script)
        .arg(path)
        .arg(output_dir)
        .output()
        .ok()?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        println!("Python output: {}", stdout);
        serde_json::from_str(&stdout).ok()
    } else {
        println!("Python error: {}", String::from_utf8_lossy(&output.stderr));
        None
    }
}

fn process_clip_file(path: PathBuf, app_handle: &AppHandle) {
    println!("Detected change in: {:?}", path);

    if let Some((python_script, output_dir)) = resolve_resource_paths(app_handle) {
        if let Some(mut json) = run_extraction(&python_script, &path, &output_dir) {
            if json["status"] == "success" {
                if let Some(path_str) = json["thumbnail_path"].as_str() {
                    if let Ok(canon_path) = fs::canonicalize(path_str) {
                        let clean = clean_windows_path(canon_path);
                        json["thumbnail_path"] = serde_json::Value::String(clean);
                    }
                }
                let _ = app_handle.emit("thumbnail-generated", &json);
            }
        }
    }
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
            if let Ok(event) = res {
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

                        process_clip_file(path.clone(), &app_handle);
                    }
                }
            } else if let Err(e) = res {
                println!("watch error: {:?}", e);
            }
        }
    });

    Ok(())
}
