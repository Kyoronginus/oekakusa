import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Film } from "lucide-react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { Commit } from "../../hooks/useDashboardData";
import { writeFile, mkdir } from "@tauri-apps/plugin-fs";
import { appCacheDir, join } from "@tauri-apps/api/path";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

interface ExportGifModalProps {
  isOpen: boolean;
  onClose: () => void;
  commits: Commit[];
  isTauri: boolean;
}

const ExportGifModal = ({
  isOpen,
  onClose,
  commits,
  isTauri,
}: ExportGifModalProps) => {
  const [exportingPath, setExportingPath] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState<string>("");
  const [userExportPath, setUserExportPath] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchSettings = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.exportPath) {
            setUserExportPath(data.exportPath);
          }
        }
      } catch (e) {
        console.error("Failed to load export settings", e);
      }
    };
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

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
        outputPath: userExportPath, // Pass custom path if set
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
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in border border-gray-100/50">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
              <Film className="text-purple-600 sm:w-6 sm:h-6" />
              Export Timelapse
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Select a project to generate a GIF from your progress
            </p>
          </div>
          <button
            onClick={() => !exportingPath && onClose()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 disabled:opacity-50"
            disabled={!!exportingPath}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-gray-50/50 flex-1">
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
                  className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-5 transition-all
                    ${
                      isExportingOther
                        ? "opacity-50 blur-[1px]"
                        : "hover:shadow-md hover:border-purple-200"
                    }
                  `}
                >
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
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
                      className="font-bold text-gray-800 text-lg truncate mb-1"
                      title={proj.path}
                    >
                      {proj.name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-600">
                        {proj.commits.length} Frames
                      </span>
                      <span className="text-xs">
                        Updated{" "}
                        {new Date(latest.timestamp * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleExportGif(proj.commits, proj.path)}
                    disabled={!!exportingPath}
                    className={`px-5 py-2.5 rounded-xl font-medium shadow-sm whitespace-nowrap flex items-center gap-2 text-sm transition-all
                       ${
                         isExportingThis
                           ? "bg-purple-100 text-purple-700 cursor-wait ring-1 ring-purple-200"
                           : "bg-purple-600 text-white hover:bg-purple-700 hover:shadow active:scale-95"
                       }
                       ${
                         !!exportingPath && !isExportingThis
                           ? "opacity-50 cursor-not-allowed"
                           : ""
                       }
                     `}
                  >
                    {isExportingThis ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span>{progressMsg || "Processing..."}</span>
                      </>
                    ) : (
                      "Create GIF"
                    )}
                  </button>
                </div>
              );
            })}

            {projects.length === 0 && (
              <div className="text-center py-12 px-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
                <Film className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-600">
                  No Projects Found
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  Start tracking your artwork to create timelapses.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
          <button
            onClick={onClose}
            disabled={!!exportingPath}
            className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors text-sm disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ExportGifModal;
