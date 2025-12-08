# Oekakusa

Oekakusa is a gamified productivity tool for digital artists using Clip Studio Paint. It tracks your drawing activity, generates thumbnails, and creates progress GIFs, all powered by a native Rust backend.

## Features

- **Automatic Thumbnail Extraction**: Watch folders for `.clip` files and automatically extract thumbnails.
- **Progress GIFs**: Create timelapses of your artwork from extracted thumbnails.
- **Native Performance**: Built with Tauri and Rust, requiring no external dependencies like Python.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Rust](https://www.rust-lang.org/)

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

### Running Locally

```bash
npm install
npm run tauri dev
```
