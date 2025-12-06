import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { Zap, Activity, Film, Settings, LogOut, User } from 'lucide-react';

import ContributionGraph from './ContributionGraph';
import StatsOverview from './dashboard/StatsOverview';
import RecentCommits from './dashboard/RecentCommits';
import ExportGifModal from './dashboard/ExportGifModal';

import { useDashboardData } from '../hooks/useDashboardData';
import { useThumbnailListener } from '../hooks/useThumbnailListener';
import { getLocalYYYYMMDD } from '../utils/dateUtils';

// Force HMR update

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
    <div className="min-h-screen flex flex-col bg-surface text-gray-800 p-8 relative">
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

      {/* Header */}    
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold flex items-center gap-2 text-primary">
          <Zap className="text-secondary" /> Dashboard
        </h1>
        <p className="text-gray-500 text-sm">{new Date().toLocaleDateString()}</p>

        <p className="text-gray-500 text-sm">Welcome, <span className="text-primary font-bold">{auth.currentUser?.displayName || 'Artist'}</span></p>
        <div className="flex gap-4">
          <button 
            onClick={handleCheckNetwork} 
            className="p-2 bg-secondary/10 text-secondary rounded hover:bg-secondary/20 flex items-center gap-2 transition"
            title="Test Network"
          >
            <Activity size={20} /> Test Net
          </button>
          
          <button 
            onClick={() => setShowExportModal(true)} 
            className="p-2 bg-primary/10 text-primary rounded hover:bg-primary/20 flex items-center gap-2 transition"
            title="Export GIF"
          >
            <Film size={20} /> Export GIF
          </button>

          <button onClick={() => navigate('/settings')} className="p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 text-gray-500 hover:text-primary transition" title="Watch Settings">
            <Settings size={20} />
          </button>
          <button onClick={() => navigate('/profile')} className="p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 text-gray-500 hover:text-primary transition" title="Profile">
             <User size={20} />
          </button>
          <button onClick={handleLogout} className="p-2 bg-red-50 text-red-500 border border-red-100 rounded hover:bg-red-100 transition" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <StatsOverview 
        xp={xp} 
        streak={streak} 
        todaysCommits={heatmapValues.find(v => v.date === getLocalYYYYMMDD())?.count || 0} 
      />

      <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Activity</h2>
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
