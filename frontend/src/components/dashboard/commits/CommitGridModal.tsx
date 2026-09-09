import { useState } from "react";
import { X, Film } from "lucide-react";
import { Commit } from "../../../hooks/useDashboardData";
import { convertFileSrc } from "@tauri-apps/api/core";
import CommitDetailModal from "./CommitDetailModal";
import ExportGifModal from "../ExportGifModal";

interface CommitGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  commits: Commit[];
  isTauri: boolean;
}

const CommitGridModal = ({
  isOpen,
  onClose,
  title,
  commits,
  isTauri,
}: CommitGridModalProps) => {
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [showExportGif, setShowExportGif] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{title}</h2>
              <p className="text-sm text-gray-500">
                {commits.length} commits found
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowExportGif(true)}
                className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg flex items-center gap-2 text-sm font-medium transition"
                title="Export GIF from these commits"
              >
                <Film size={18} /> Export GIF
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Grid Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {commits.map((commit, index) => (
                <div
                  key={commit.id || index}
                  className="bg-gray-50 rounded-lg overflow-hidden group relative cursor-pointer hover:ring-2 hover:ring-primary transition shadow-sm border border-gray-200"
                  onClick={() => setSelectedCommit(commit)}
                >
                  <img
                    src={
                      commit.thumbnail_url ||
                      (isTauri
                        ? convertFileSrc(commit.thumbnail_path)
                        : "https://placehold.co/400x300?text=Web+View")
                    }
                    alt="Thumbnail"
                    className="w-full h-32 object-cover transition transform group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://placehold.co/400x300?text=Broken+Link";
                    }}
                  />
                  <div className="p-2">
                    <p className="text-xs text-gray-500">
                      {new Date(commit.timestamp * 1000).toLocaleString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
              ))}
              {commits.length === 0 && (
                <div className="col-span-full py-10 text-center text-gray-400">
                  No commits to display.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CommitDetailModal
        isOpen={!!selectedCommit}
        onClose={() => setSelectedCommit(null)}
        commit={selectedCommit}
        isTauri={isTauri}
      />

      <ExportGifModal
        isOpen={showExportGif}
        onClose={() => setShowExportGif(false)}
        commits={commits} // Pass ONLY the filtered commits for this illustration/day
        isTauri={isTauri}
      />
    </>
  );
};

export default CommitGridModal;
