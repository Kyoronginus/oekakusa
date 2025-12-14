import React from "react";
import { ArrowLeft } from "lucide-react";
import { Commit } from "../../../hooks/useDashboardData";
import CommitTimeBarChart from "./CommitTimeBarChart";
import StatsOverview from "./StatsOverview";

interface StatisticsScreenProps {
  commits: Commit[];
  onBack: () => void;
  xp: number;
  streak: number;
}

const StatisticsScreen: React.FC<StatisticsScreenProps> = ({
  commits,
  onBack,
  xp,
  streak,
}) => {
  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white rounded-full transition-colors text-gray-600 hover:text-gray-900 shadow-sm border border-transparent hover:border-gray-200"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Statistics Detail</h1>
      </div>

      <StatsOverview xp={xp} streak={streak} todaysCommits={0} />

      <CommitTimeBarChart commits={commits} />

      {/* Placeholder for future stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 min-h-[200px] flex items-center justify-center text-gray-400">
          More stats coming soon...
        </div>
      </div>
    </div>
  );
};

export default StatisticsScreen;
