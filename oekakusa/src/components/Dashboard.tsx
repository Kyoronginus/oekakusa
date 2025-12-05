import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { Zap, Activity, Film, Settings, LogOut } from 'lucide-react';

import ContributionGraph from './ContributionGraph';
import StatsOverview from './dashboard/StatsOverview';
import RecentCommits from './dashboard/RecentCommits';
import ExportGifModal from './dashboard/ExportGifModal';

import { useDashboardData } from '../hooks/useDashboardData';
import { useThumbnailListener } from '../hooks/useThumbnailListener';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
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

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const handleCheckNetwork = async () => {
    try {
      await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' });
      alert('Network Check: SUCCESS');
    } catch (e) {
      alert('Network Check: FAILED ' + e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 relative">
      {/* Tauri Warning Banner */}
      {!isTauri && (
        <div className="bg-yellow-600 text-white p-4 rounded-lg mb-8 flex items-center gap-3">
          <Zap className="text-yellow-300" />
          <div>
            <p className="font-bold">Browser Mode Detected</p>
            <p className="text-sm">Tauri backend features disabled.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Zap className="text-yellow-400" /> Oekakusa Dashboard
        </h1>
        <div className="flex gap-4">
          <button 
            onClick={handleCheckNetwork} 
            className="p-2 bg-blue-600 rounded hover:bg-blue-500 flex items-center gap-2"
          >
            <Activity size={20} /> Test Net
          </button>
          
          <button 
            onClick={() => setShowExportModal(true)} 
            className="p-2 bg-purple-600 rounded hover:bg-purple-500 flex items-center gap-2"
          >
            <Film size={20} /> Export GIF
          </button>

          <button onClick={() => navigate('/settings')} className="p-2 bg-gray-800 rounded hover:bg-gray-700">
            <Settings size={20} />
          </button>
          <button onClick={handleLogout} className="p-2 bg-red-900 rounded hover:bg-red-800">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <StatsOverview 
        xp={xp} 
        streak={streak} 
        todaysCommits={heatmapValues.find(v => v.date === new Date().toISOString().split('T')[0])?.count || 0} 
      />

      <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Activity</h2>
        <ContributionGraph values={heatmapValues} />
      </div>

      <RecentCommits commits={commits} isTauri={isTauri} />

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
