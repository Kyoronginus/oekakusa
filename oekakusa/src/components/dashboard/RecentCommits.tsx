import React, { useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Commit } from '../../hooks/useDashboardData';
import CommitDetailModal from './CommitDetailModal';

interface RecentCommitsProps {
  commits: Commit[];
  isTauri: boolean;
}

const RecentCommits: React.FC<RecentCommitsProps> = ({ commits, isTauri }) => {
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Commits</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {commits.slice(0, 12).map((commit, index) => { // Limit to recent 12
            return (
            <div 
              key={index} 
              className="bg-gray-50 rounded-lg overflow-hidden group relative cursor-pointer hover:ring-2 hover:ring-primary transition shadow-sm border border-gray-200"
              onClick={() => setSelectedCommit(commit)}
            >
              <img 
                src={commit.thumbnail_url || (isTauri ? convertFileSrc(commit.thumbnail_path) : "https://placehold.co/400x300?text=Web+View")} 
                alt="Thumbnail" 
                className="w-full h-32 object-cover transition transform group-hover:scale-105"
                onError={(e) => {
                  console.error("Image load failed:", commit.path);
                  e.currentTarget.src = "https://placehold.co/400x300?text=Broken+Link";
                }}
              />
              <div className="p-2">
                <p className="text-xs text-gray-700 truncate font-medium" title={commit.path}>
                  {commit.path.split(/[\\/]/).pop()}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(commit.timestamp * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
          })}
          {commits.length === 0 && (
            <p className="text-gray-400 col-span-full text-center py-8">
              No commits yet. Start drawing!
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

export default RecentCommits;
