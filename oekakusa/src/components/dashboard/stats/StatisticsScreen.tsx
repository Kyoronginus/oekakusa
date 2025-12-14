import { ArrowLeft } from "lucide-react";
import { Commit } from "../../../hooks/useDashboardData";
import GenericBarChart from "./GenericBarChart";
import StatsOverview from "./StatsOverview";
import { useStatisticsData } from "./statsData";

interface StatisticsScreenProps {
  commits: Commit[];
  onBack: () => void;
  xp: number;
  streak: number;
}

const StatisticsScreen = ({
  commits,
  onBack,
  xp,
  streak,
}: StatisticsScreenProps) => {
  const { hourData, weekData, monthDayData, yearData } =
    useStatisticsData(commits);

  return (
    <div className="bg-gray-50 min-h-screen p-8 animate-fade-in-up">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white rounded-full transition-colors text-gray-600 hover:text-gray-900 shadow-sm border border-transparent hover:border-gray-200"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-1xl font-bold text-gray-800">
            Productivity Statistics
          </h1>
        </div>

        <StatsOverview xp={xp} streak={streak} commits={commits} />
        <GenericBarChart
          title="Productivity by Hour"
          data={hourData}
          labelInterval={3}
          color="#f6c05c"
        />
        {/* TIME ANALYSIS GRID */}
        <div className="grid grid-cols-2 gap-6">
          <GenericBarChart
            title="Productivity by Day of Week"
            data={weekData}
            color="#ec4899" // Pink
          />
          <GenericBarChart
            title="Productivity by Day of Month"
            data={monthDayData}
            labelInterval={5}
            color="#3b82f6" // Blue
          />
          <GenericBarChart
            title="Productivity by Month"
            data={yearData}
            color="#10b981" // Green
          />
        </div>
      </div>
    </div>
  );
};

export default StatisticsScreen;
