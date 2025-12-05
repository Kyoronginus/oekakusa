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
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex items-center gap-4">
        <div className="p-3 bg-blue-900 rounded-full">
          <Activity className="text-blue-400" size={24} />
        </div>
        <div>
          <p className="text-gray-400 text-sm">Total XP</p>
          <p className="text-2xl font-bold">{xp} XP</p>
        </div>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex items-center gap-4">
        <div className="p-3 bg-orange-900 rounded-full">
          <Flame className="text-orange-400" size={24} />
        </div>
        <div>
          <p className="text-gray-400 text-sm">Current Streak</p>
          <p className="text-2xl font-bold">{streak} Days</p>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex items-center gap-4">
        <div className="p-3 bg-green-900 rounded-full">
          <Zap className="text-green-400" size={24} />
        </div>
        <div>
          <p className="text-gray-400 text-sm">Today's Commits</p>
          <p className="text-2xl font-bold">{todaysCommits}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
