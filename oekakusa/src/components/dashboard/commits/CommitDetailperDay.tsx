import React, { useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Commit } from "../../../hooks/useDashboardData";
import CommitDetailModal from "./CommitDetailModal";
import { X } from "lucide-react";

interface DayCommitDetailProps {
  date: string; // YYYY-MM-DD
  commits: Commit[];
  isTauri: boolean;
  onClose: () => void;
}

const DayCommitDetail: React.FC<DayCommitDetailProps> = ({
  date,
  commits,
  isTauri,
  onClose,
}) => {
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);

  // Parse date for display
  const displayDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
          title="Close Details"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-2 text-gray-800">
          Commits on <span className="text-primary">{displayDate}</span>
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {commits.length} commits recorded
        </p>

        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
          {commits.map((commit, index) => {
            return (
              <div
                key={commit.id || index}
                className="bg-gray-50 rounded-lg overflow-hidden group relative cursor-pointer hover:ring-2 hover:ring-primary transition shadow-sm border border-gray-200"
                onClick={() => setSelectedCommit(commit)}
              >
                <img
                  src={
                    commit.thumbnail_url ||
                    (isTauri
                      ? convertFileSrc(
                          commit.thumbnail_small_path || commit.thumbnail_path
                        )
                      : "https://placehold.co/400x300?text=Web+View")
                  }
                  alt="Thumbnail"
                  className="w-full h-24 object-cover transition transform group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/400x300?text=Broken+Link";
                  }}
                />
                <div className="p-2">
                  <p
                    className="text-xs text-gray-700 truncate font-medium"
                    title={commit.path}
                  >
                    {commit.path.split(/[\\/]/).pop()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(commit.timestamp * 1000).toLocaleTimeString(
                      "en-US",
                      { hour: "2-digit", minute: "2-digit" }
                    )}
                  </p>
                </div>
              </div>
            );
          })}

          {commits.length === 0 && (
            <p className="text-gray-400 col-span-full text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              No commits found (or none for this day).
            </p>
          )}
        </div>
      </div>

      <CommitDetailModal
        isOpen={!!selectedCommit}
        onClose={() => setSelectedCommit(null)}
        commit={selectedCommit}
        isTauri={isTauri}
      />
    </>
  );
};

export default DayCommitDetail;
