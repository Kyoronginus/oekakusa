import React, { useEffect, useState } from "react";
import { Zap } from "lucide-react";

import ContributionGraph from "./contributionGraph/ContributionGraph";
import StatsOverview from "./dashboard/stats/StatsOverview";
import RecentCommits from "./dashboard/RecentCommits";
import ExportGifModal from "./dashboard/ExportGifModal";
import DashboardHeader from "./DashBoardHeader";

import { useDashboardData } from "../hooks/useDashboardData";
import { useThumbnailListener } from "../hooks/useThumbnailListener";
import { getLocalYYYYMMDD } from "../utils/dateUtils";

const Dashboard: React.FC = () => {
  const [isTauri, setIsTauri] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Custom Hooks
  const { commits, xp, streak, heatmapValues } = useDashboardData();
  useThumbnailListener(isTauri);

  useEffect(() => {
    // @ts-ignore
    const isTauriCheck = !!(window.__TAURI__ || window.__TAURI_INTERNALS__);
    setIsTauri(isTauriCheck);
  }, []);

  return (
    <div className="min-h-screen bg-surface text-gray-800 p-8 relative">
      {/* Tauri Warning Banner */}
      {!isTauri && (
        <div className="bg-orange-100 text-orange-800 p-4 rounded-lg mb-8 flex items-center gap-3 border border-orange-200">
          <Zap className="text-orange-500" />
          <div>
            <p className="font-bold">Browser Mode Detected</p>
            <p className="text-sm">Tauri backend features disabled.</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-6xl mx-auto space-y-8">
        <DashboardHeader setShowExportModal={setShowExportModal} />

        <StatsOverview
          xp={xp}
          streak={streak}
          todaysCommits={
            heatmapValues.find((v) => v.date === getLocalYYYYMMDD())?.count || 0
          }
        />

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Activity</h2>
          <div className="mx-10">
            <ContributionGraph values={heatmapValues} />
          </div>
        </div>

        <RecentCommits commits={commits} isTauri={isTauri} />
      </div>

      <ExportGifModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        commits={commits}
        isTauri={isTauri}
      />
    </div>
  );
};

export default Dashboard;
