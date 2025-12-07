import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, FolderPlus, FilePlus, Trash2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { auth, db } from "../../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [paths, setPaths] = useState<string[]>([]);
  const [exportPath, setExportPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [isTauri, setIsTauri] = useState(false);

  const user = auth.currentUser;

  useEffect(() => {
    // @ts-ignore
    setIsTauri(!!(window.__TAURI__ || window.__TAURI_INTERNALS__));
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.watchPaths) {
            setPaths(data.watchPaths);
            // Sync backend just in case
            if (isTauri) {
              await invoke("update_watch_paths", { paths: data.watchPaths });
            }
          }
          if (data.exportPath) {
            setExportPath(data.exportPath);
          }
        }
      } catch (e) {
        console.error("Failed to load settings:", e);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [user, isTauri]);

  const handleAddFolder = async () => {
    if (!isTauri) {
      alert("File picking is only available in the Tauri desktop app.");
      return;
    }
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (selected) {
        // @ts-ignore
        if (!paths.includes(selected)) {
          // @ts-ignore
          setPaths([...paths, selected]);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Failed to open dialog: " + e);
    }
  };

  const handleSetExportPath = async () => {
    if (!isTauri) {
      alert("File picking is only available in the Tauri desktop app.");
      return;
    }
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (selected) {
        // @ts-ignore
        setExportPath(selected);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to open dialog: " + e);
    }
  };

  const handleAddFile = async () => {
    if (!isTauri) {
      alert("File picking is only available in the Tauri desktop app.");
      return;
    }
    try {
      const selected = await open({
        directory: false,
        multiple: false,
        filters: [
          {
            name: "Clip Studio Paint",
            extensions: ["clip"],
          },
        ],
      });
      if (selected) {
        // @ts-ignore
        if (!paths.includes(selected)) {
          // @ts-ignore
          setPaths([...paths, selected]);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Failed to open dialog: " + e);
    }
  };

  const handleRemovePath = (pathToRemove: string) => {
    setPaths(paths.filter((p) => p !== pathToRemove));
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // 1. Save to Firestore
      await setDoc(
        doc(db, "users", user.uid),
        {
          watchPaths: paths,
          exportPath: exportPath || null,
        },
        { merge: true }
      );

      // 2. Update Rust Backend
      if (isTauri) {
        await invoke("update_watch_paths", { paths });
      }

      alert("Settings saved and watchers updated!");
    } catch (e) {
      console.error(e);
      alert("Failed to save settings: " + e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-gray-800 p-8">
      <div className="w-full max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-6 flex items-center gap-2 text-gray-500 hover:text-primary transition"
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>

        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h1 className="text-2xl font-bold mb-6 text-primary">
            Watch Settings
          </h1>

          <div className="mb-6">
            <p className="text-gray-500 mb-4">
              Add folders or specific files to monitor. Oekakusa will track any
              changes to `.clip` files in these locations.
            </p>

            <div className="flex gap-4 mb-4">
              <button
                onClick={handleAddFolder}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded transition border border-gray-200"
              >
                <FolderPlus size={18} /> Add Folder
              </button>
              <button
                onClick={handleAddFile}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded transition border border-gray-200"
              >
                <FilePlus size={18} /> Add File
              </button>
            </div>

            <div className="space-y-2 bg-gray-50 p-4 rounded-lg min-h-[100px] border border-gray-200">
              {paths.length === 0 && (
                <p className="text-gray-400 italic">No paths added yet.</p>
              )}
              {paths.map((p, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center bg-white p-2 rounded shadow-sm border border-gray-100"
                >
                  <span
                    className="truncate text-sm font-mono text-gray-600"
                    title={p}
                  >
                    {p}
                  </span>
                  <button
                    onClick={() => handleRemovePath(p)}
                    className="text-red-400 hover:text-red-500 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6 border-t pt-6">
            <h2 className="text-lg font-bold mb-4 text-primary">
              Export Settings
            </h2>
            <p className="text-gray-500 mb-4">
              Select a default directory for saving exported GIFs and Images.
            </p>
            <div className="flex gap-4 items-center">
              <input
                type="text"
                readOnly
                value={exportPath || ""}
                placeholder="No directory selected (Defaults to AppData)"
                className="flex-1 p-2 border border-gray-300 rounded bg-gray-50 text-gray-600 text-sm"
              />
              <button
                onClick={handleSetExportPath}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded transition border border-gray-200 whitespace-nowrap"
              >
                <FolderPlus size={18} /> Select Folder
              </button>
              {exportPath && (
                <button
                  onClick={() => setExportPath(null)}
                  className="text-red-400 hover:text-red-500 p-2 border border-transparent hover:border-red-100 rounded"
                  title="Clear"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className={`bg-primary hover:bg-primary-dark text-black px-4 py-2 rounded flex items-center gap-2 shadow-md ${
                loading ? "opacity-50" : ""
              }`}
            >
              <Save size={20} /> {loading ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
