import React from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Commit } from '../../hooks/useDashboardData';

interface RecentCommitsProps {
  commits: Commit[];
  isTauri: boolean;
}

const RecentCommits: React.FC<RecentCommitsProps> = ({ commits, isTauri }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Recent Commits</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {commits.slice(0, 12).map((commit, index) => { // Limit to recent 12
          return (
          <div key={index} className="bg-gray-700 rounded-lg overflow-hidden group relative">
            <img 
              src={commit.thumbnail_url || (isTauri ? convertFileSrc(commit.thumbnail_path) : "https://placehold.co/400x300?text=Web+View")} 
              alt="Thumbnail" 
              className="w-full h-32 object-cover"
              onError={(e) => {
                console.error("Image load failed:", commit.path);
                e.currentTarget.src = "https://placehold.co/400x300?text=Broken+Link";
              }}
            />
            <div className="p-2">
              <p className="text-xs text-gray-300 truncate" title={commit.path}>
                {commit.path.split(/[\\/]/).pop()}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(commit.timestamp * 1000).toLocaleTimeString()}
              </p>
            </div>
          </div>
        );
        })}
        {commits.length === 0 && (
          <p className="text-gray-500 col-span-full text-center py-8">
            No commits yet. Start drawing!
          </p>
        )}
      </div>
    </div>
  );
};

export default RecentCommits;
