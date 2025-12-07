import React, { useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Commit } from "../../../hooks/useDashboardData";
import CommitGridModal from "../commits/CommitGridModal";

interface Illustration {
  id: string;
  name: string;
  thumbnail: string;
  commits: number;
  lastUpdated: number;
  path: string;
}

interface IllustrationGalleryProps {
  commits: Commit[];
  isTauri: boolean;
}

const IllustrationGallery: React.FC<IllustrationGalleryProps> = ({
  commits,
  isTauri,
}) => {
  const [selectedIllustrationPath, setSelectedIllustrationPath] = useState<
    string | null
  >(null);

  // Group commits by path to identify unique illustrations
  const illustrations = React.useMemo(() => {
    const map = new Map<string, Illustration>();

    commits.forEach((commit) => {
      if (!map.has(commit.path)) {
        map.set(commit.path, {
          id: commit.path,
          name: commit.path.split(/[\\/]/).pop() || "Unknown",
          thumbnail:
            commit.thumbnail_url ||
            (isTauri
              ? convertFileSrc(commit.thumbnail_path)
              : "https://placehold.co/400x300?text=Web+View"),
          commits: 0,
          lastUpdated: 0,
          path: commit.path,
        });
      }

      const illust = map.get(commit.path)!;
      illust.commits += 1;
      illust.lastUpdated = Math.max(illust.lastUpdated, commit.timestamp);

      if (commit.timestamp === illust.lastUpdated) {
        illust.thumbnail =
          commit.thumbnail_url ||
          (isTauri
            ? convertFileSrc(commit.thumbnail_path)
            : "https://placehold.co/400x300?text=Web+View");
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => b.lastUpdated - a.lastUpdated
    );
  }, [commits, isTauri]);

  const selectedCommits = React.useMemo(() => {
    if (!selectedIllustrationPath) return [];
    return commits.filter((c) => c.path === selectedIllustrationPath);
  }, [selectedIllustrationPath, commits]);

  const selectedIllustrationName =
    selectedIllustrationPath?.split(/[\\/]/).pop() || "Illustration";

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Illustrations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {illustrations.map((illust) => (
            <div
              key={illust.id}
              onClick={() => setSelectedIllustrationPath(illust.path)}
              className="group bg-gray-50 rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
            >
              <div className="relative aspect-video bg-gray-200">
                <img
                  src={illust.thumbnail}
                  alt={illust.name}
                  className="w-full h-full object-cover transition transform group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/400x300?text=No+Image";
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p
                    className="text-white font-medium truncate"
                    title={illust.name}
                  >
                    {illust.name}
                  </p>
                </div>
              </div>
              <div className="p-4 flex justify-between items-center text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500">Commits</span>
                  <span className="font-semibold text-gray-800 text-lg">
                    {illust.commits}
                  </span>
                </div>
                <div className="text-right flex flex-col">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="text-gray-700">
                    {new Date(illust.lastUpdated * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {illustrations.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-400">
              No illustrations found.
            </div>
          )}
        </div>
      </div>

      <CommitGridModal
        isOpen={!!selectedIllustrationPath}
        onClose={() => setSelectedIllustrationPath(null)}
        title={`History: ${selectedIllustrationName}`}
        commits={selectedCommits}
        isTauri={isTauri}
      />
    </>
  );
};

export default IllustrationGallery;
