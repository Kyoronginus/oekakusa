import { useState } from "react";
import { X, Calendar, Folder, Save, Trash2 } from "lucide-react";
import { Commit } from "../../../hooks/useDashboardData";
import { convertFileSrc } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile, readFile } from "@tauri-apps/plugin-fs";
import { auth, db } from "../../../firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { invoke } from "@tauri-apps/api/core";

interface CommitDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  commit: Commit | null;
  isTauri: boolean;
}

const CommitDetailModal = ({
  isOpen,
  onClose,
  commit,
  isTauri,
}: CommitDetailModalProps) => {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !commit) return null;

  const handleDelete = async () => {
    if (!commit) return;

    try {
      setDeleting(true);

      // 1. Delete from Firestore
      const user = auth.currentUser;
      if (user && commit.id) {
        await deleteDoc(doc(db, "users", user.uid, "commits", commit.id));
      }

      // 2. Delete local files (if in Tauri mode)
      if (isTauri) {
        try {
          // Note: command name must verify against what we registered in Rust
          await invoke("delete_thumbnail_files", {
            thumbnailPath: commit.thumbnail_path, // Backend expects snake_case but invoke converts camelCase keys automatically? Verification: tauri usually expects camelCase args mapping to snake_case in Rust.
            // Rust signature: thumbnail_path: String
            // Invoke args: { thumbnailPath: ... } -> maps to thumbnail_path
            thumbnailSmallPath: commit.thumbnail_small_path,
            thumbnailFullPath: commit.thumbnail_full_path,
          });
        } catch (err) {
          console.error("Failed to delete local files:", err);
          // We continue even if local delete fails, to ensure UI is updated
        }
      }

      onClose();
      // Optional: Trigger a refresh if needed, but the live listener should handle it.
    } catch (e) {
      console.error("Failed to delete commit:", e);
      alert("Failed to delete commit: " + e);
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveImage = async () => {
    if (!commit) return;

    // Web Mode Download
    if (!isTauri) {
      const link = document.createElement("a");
      link.href = commit.thumbnail_url || "";
      link.download = `commit_${commit.id || "image"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Tauri Mode Save
    try {
      setSaving(true);

      let defaultPath = `commit_${commit.id || Date.now()}.png`;

      // Try to get user export path
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().exportPath) {
            // We don't have 'join' here unless imported.
            // Simple string concat for now, assuming Windows/Standard separators or wait..
            // We should probably just pass the directory to the dialog defaultPath if supported?
            // Actually defaultPath in save() can be a full path.
            // Let's rely on simple slash concatenation or just use filename if failing.
            const ep = userDoc.data().exportPath;
            // Strip trailing slash if present
            const cleanEp = ep.replace(/[\\/]$/, "");
            defaultPath = `${cleanEp}\\commit_${commit.id || Date.now()}.png`;
          }
        } catch (e) {
          console.warn("Failed to fetch export settings", e);
        }
      }

      // User picks destination (starting at defaultPath)
      const savePath = await save({
        defaultPath: defaultPath,
        filters: [
          {
            name: "Image",
            extensions: ["png", "jpg"],
          },
        ],
      });

      if (!savePath) {
        setSaving(false);
        return;
      }

      // Logic to read the source file and write to new location
      let buffer: Uint8Array;

      if (commit.thumbnail_url) {
        // It's a remote URL
        const { fetch: tauriFetch } = await import("@tauri-apps/plugin-http");
        const response = await tauriFetch(commit.thumbnail_url);
        const blob = await response.blob();
        const ab = await blob.arrayBuffer();
        buffer = new Uint8Array(ab);
      } else if (commit.thumbnail_path) {
        // It's a local file
        buffer = await readFile(commit.thumbnail_path);
      } else {
        throw new Error("No image source available to save.");
      }

      await writeFile(savePath, buffer);
      alert("Image saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save image: " + e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
        >
          <X size={24} />
        </button>

        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
          <img
            src={
              commit.thumbnail_url ||
              (isTauri
                ? convertFileSrc(
                    commit.thumbnail_full_path || commit.thumbnail_path
                  )
                : "https://placehold.co/800x600?text=Web+View")
            }
            alt="Commit Detail"
            className="max-w-full max-h-[70vh] object-contain shadow-md rounded"
          />
        </div>

        <div className="p-6 bg-white border-t flex justify-between items-end">
          <div>
            {/* ... Left side content ... */}
            <h2 className="text-2xl font-bold mb-2 text-gray-800 flex items-center gap-2">
              <span className="truncate">
                {commit.path.split(/[\\/]/).pop()}
              </span>
            </h2>

            <div className="flex flex-wrap gap-6 text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-orange-500" />
                <span>
                  {new Date(commit.timestamp * 1000).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Folder size={18} className="text-blue-500" />
                <span className="truncate max-w-md text-sm" title={commit.path}>
                  {commit.path}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting || saving}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 flex items-center gap-2 shadow-sm transition"
            >
              {deleting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
              ) : (
                <Trash2 size={20} />
              )}
              Delete
            </button>

            <button
              onClick={handleSaveImage}
              disabled={saving || deleting}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 shadow-lg transition"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save size={20} />
              )}
              Save Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommitDetailModal;
