import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Film } from "lucide-react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { Commit } from "../../hooks/useDashboardData";
import { writeFile, mkdir } from "@tauri-apps/plugin-fs";
import { appCacheDir, join } from "@tauri-apps/api/path";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

interface ExportGifModalProps {
  isOpen: boolean;
  onClose: () => void;
  commits: Commit[];
  isTauri: boolean;
}

const ExportGifModal: React.FC<ExportGifModalProps> = ({
  isOpen,
  onClose,
  commits,
  isTauri,
}) => {
  const [exportingPath, setExportingPath] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState<string>("");

  // Group commits by file path
  const projects = React.useMemo(() => {
    const map = new Map<
      string,
      { name: string; path: string; commits: Commit[] }
    >();
    commits.forEach((c) => {
      if (!map.has(c.path)) {
        map.set(c.path, {
          path: c.path,
          name: c.path.split(/[\\/]/).pop() || "Untitled",
          commits: [],
        });
      }
      map.get(c.path)!.commits.push(c);
    });
    return Array.from(map.values());
  }, [commits]);

  console.log(
    "ExportGifModal Rendered. isOpen:",
    isOpen,
    "Projects:",
    projects.length
  );

  if (!isOpen) return null;

  const handleExportGif = async (
    commitsToExport: Commit[],
    projectPath: string
  ) => {
    console.log("Export GIF clicked for:", projectPath);
    if (exportingPath) return;
    setExportingPath(projectPath);
    setProgressMsg("Preparing...");

    try {
      if (!isTauri) {
        alert("GIF Export is only available in Tauri desktop app.");
        return;
      }

      const sortedCommits = [...commitsToExport].sort(
        (a, b) => a.timestamp - b.timestamp
      );

      if (sortedCommits.length === 0) {
        alert("No commits to export!");
        return;
      }

      // Download images to Cache Directory
      const downloadedPaths: string[] = [];
      const cacheDir = await appCacheDir();
      const tempDir = await join(cacheDir, "gif_temp");

      // Ensure temp dir exists
      try {
        await mkdir(tempDir, { recursive: true });
      } catch (e) {
        console.warn("Dir creation error (migth exist):", e);
      }

      for (let i = 0; i < sortedCommits.length; i++) {
        const commit = sortedCommits[i];
        setProgressMsg(`Downloading frame ${i + 1}/${sortedCommits.length}...`);

        // Prefer URL, fallback to local path if URL missing (unlikely if uploaded)
        if (commit.thumbnail_url) {
          try {
            console.log(`Downloading: ${commit.thumbnail_url}`);
            const response = await tauriFetch(commit.thumbnail_url);
            const blob = await response.blob();
            const buffer = await blob.arrayBuffer();
            const fileName = `${commit.timestamp}_${i}.png`; // Unique name
            const filePath = await join(tempDir, fileName);

            await writeFile(filePath, new Uint8Array(buffer));
            downloadedPaths.push(filePath);
          } catch (err) {
            console.error(`Failed to download ${commit.thumbnail_url}:`, err);
            downloadedPaths.push(commit.thumbnail_path);
          }
        } else {
          console.log("No URL, using local path:", commit.thumbnail_path);
          downloadedPaths.push(commit.thumbnail_path);
        }
      }

      // Filter out invalid paths
      if (downloadedPaths.length === 0) {
        throw new Error("No images could be prepared for GIF.");
      }

      setProgressMsg(`Generating GIF with ${downloadedPaths.length} frames...`);
      console.log(
        `Exporting GIF for ${projectPath} with paths:`,
        downloadedPaths
      );

      const result = await invoke("export_gif", {
        imagePaths: downloadedPaths,
      });
      console.log("Export result:", result);
      alert(`GIF Exported Successfully to:\n${result}`);
      onClose();
    } catch (error) {
      console.error("Export Failed:", error);
      alert(`Failed to export GIF: ${error}`);
    } finally {
      setExportingPath(null);
      setProgressMsg("");
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center p-4 text-white">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl relative">
        <div className="p-6 flex justify-between items-center bg-gray-400">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Film className="text-purple-400" /> Export GIF Timelapse
          </h2>
          <button
            onClick={() => !exportingPath && onClose()}
            className="text-gray-400 hover:text-white text-2xl leading-none disabled:opacity-50"
            disabled={!!exportingPath}
          >
            &times;
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-gray-200">
          <p className="text-gray-300 mb-4">
            Select an illustration project to generate a timelapse GIF:
          </p>

          <div className="grid grid-cols-1 gap-4">
            {projects.map((proj) => {
              const sorted = [...proj.commits].sort(
                (a, b) => b.timestamp - a.timestamp
              );
              const latest = sorted[0];
              const isExportingThis = exportingPath === proj.path;
              const isExportingOther = !!exportingPath && !isExportingThis;

              return (
                <div
                  key={proj.path}
                  className={`bg-gray-300 p-4 rounded-lg flex items-center gap-4 transition-colors ${
                    isExportingOther ? "opacity-50" : "hover:bg-gray-650"
                  }`}
                >
                  <div className="w-20 h-20 bg-gray-900 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={
                        latest.thumbnail_url ||
                        (isTauri
                          ? convertFileSrc(latest.thumbnail_path)
                          : "https://placehold.co/100")
                      }
                      className="w-full h-full object-cover"
                      alt={proj.name}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-bold text-lg truncate"
                      title={proj.path}
                    >
                      {proj.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {proj.commits.length} snapshots
                    </p>
                    <p className="text-xs text-gray-500">
                      Last update:{" "}
                      {new Date(latest.timestamp * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleExportGif(proj.commits, proj.path)}
                    disabled={!!exportingPath}
                    className={`px-4 py-2 rounded-lg font-medium shadow-lg whitespace-nowrap flex items-center gap-2
                       ${
                         isExportingThis
                           ? "bg-purple-500 cursor-wait"
                           : "bg-purple-600 hover:bg-purple-500"
                       }
                       ${!!exportingPath ? "opacity-70 cursor-not-allowed" : ""}
                     `}
                  >
                    {isExportingThis ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {progressMsg || "Processing..."}
                      </>
                    ) : (
                      "Create GIF"
                    )}
                  </button>
                </div>
              );
            })}
            {projects.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No illustrations found with history.
              </p>
            )}
          </div>
        </div>

        <div className="p-4 bg-gray-400 text-right">
          <button
            onClick={onClose}
            disabled={!!exportingPath}
            className="px-4 py-2 text-gray-300 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ExportGifModal;
