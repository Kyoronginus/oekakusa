import React, { useEffect, useState } from "react";
import { Zap } from "lucide-react";

import ContributionGraph from "./contributionGraph/ContributionGraph";
import StatsOverview from "./stats/StatsOverview";
import RecentCommits from "./RecentCommits";
import ExportGifModal from "./ExportGifModal";
import DashboardHeader from "./DashBoardHeader";
import IllustrationGallery from "./Illustrations/IllustrationGallery";
import DayCommitDetail from "./DayCommitDetail";

import { useDashboardData } from "../../hooks/useDashboardData";
import { useThumbnailListener } from "../../hooks/useThumbnailListener";
import { getLocalYYYYMMDD } from "../../utils/dateUtils";

const Dashboard: React.FC = () => {
  const [isTauri, setIsTauri] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Feature 1: Year Selector State
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Feature 2: Selected Date for Day Detail
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Custom Hooks
  // We get ALL commits here. We need to filter them for specific views.
  const { commits, xp, streak, heatmapValues } = useDashboardData();
  useThumbnailListener(isTauri);

  useEffect(() => {
    // @ts-ignore
    const isTauriCheck = !!(window.__TAURI__ || window.__TAURI_INTERNALS__);
    setIsTauri(isTauriCheck);
  }, []);

  // Compute available years from commits
  const availableYears = React.useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear()); // Always include current year
    commits.forEach((c) => {
      years.add(new Date(c.timestamp * 1000).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a); // Descending
  }, [commits]);

  // Derived: Commits for the selected date
  const selectedDateCommits = React.useMemo(() => {
    if (!selectedDate) return [];
    return commits.filter(
      (c) => getLocalYYYYMMDD(new Date(c.timestamp * 1000)) === selectedDate
    );
  }, [selectedDate, commits]);

  // Handle Day Click from Graph
  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    // Scroll to details? optional
  };

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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Activity in {selectedYear}
            </h2>

            {/* Year Selector */}
            <div className="flex gap-2">
              {availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    selectedYear === year
                      ? "bg-primary text-black shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          <div className="mx-0 md:mx-4">
            <ContributionGraph
              values={heatmapValues}
              year={selectedYear}
              onDayClick={handleDayClick}
            />
          </div>
        </div>

        {/* Feature 2: Day Details (conditionally rendered) */}
        {selectedDate && (
          <div className="animate-fade-in-up">
            <DayCommitDetail
              date={selectedDate}
              commits={selectedDateCommits}
              isTauri={isTauri}
              onClose={() => setSelectedDate(null)}
            />
          </div>
        )}

        <RecentCommits commits={commits} isTauri={isTauri} />

        {/* Feature 3: Illustration Gallery */}
        <IllustrationGallery commits={commits} isTauri={isTauri} />
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
