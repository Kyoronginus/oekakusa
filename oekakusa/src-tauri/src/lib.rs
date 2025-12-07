use std::sync::Mutex;
use tauri::Manager;

pub mod gif;
pub mod watcher;

use watcher::WatcherState;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(WatcherState {
            watcher: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            watcher::update_watch_paths,
            gif::export_gif
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

