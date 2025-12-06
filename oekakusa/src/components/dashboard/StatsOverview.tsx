import React from 'react';
import { Activity, Flame, Zap } from 'lucide-react';

interface StatsOverviewProps {
  xp: number;
  streak: number;
  todaysCommits: number;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ xp, streak, todaysCommits }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-4 border border-gray-100">
        <div className="p-3 bg-blue-100 rounded-full">
          <Activity className="text-blue-600" size={24} />
        </div>
        <div>
          <p className="text-gray-500 text-sm">Total XP</p>
          <p className="text-2xl font-bold text-gray-800">{xp} XP</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-4 border border-gray-100">
        <div className="p-3 bg-orange-100 rounded-full">
          <Flame className="text-orange-600" size={24} />
        </div>
        <div>
          <p className="text-gray-500 text-sm">Current Streak</p>
          <p className="text-2xl font-bold text-gray-800">{streak} Days</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-4 border border-gray-100">
        <div className="p-3 bg-green-100 rounded-full">
          <Zap className="text-green-600" size={24} />
        </div>
        <div>
          <p className="text-gray-500 text-sm">Today's Commits</p>
          <p className="text-2xl font-bold text-gray-800">{todaysCommits}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
