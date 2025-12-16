import { useState } from "react";
import { Commit } from "../../hooks/useDashboardData";
import CommitDetailModal from "./commits/CommitDetailModal";
import CommitItem from "./commits/CommitItem";

interface RecentCommitsProps {
  commits: Commit[];
  isTauri: boolean;
}

const RecentCommits = ({ commits, isTauri }: RecentCommitsProps) => {
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Recent Commits
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {commits.slice(0, 20).map((commit) => (
            <CommitItem
              key={commit.id || commit.timestamp} // fallback key
              commit={commit}
              isTauri={isTauri}
              onClick={setSelectedCommit}
            />
          ))}
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
