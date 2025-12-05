import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {  ArrowLeft,  Save } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [path, setPath] = useState('');

    useEffect(() => {
        // Load settings if persisted
    }, []);

    const handleSave = async () => {
      // Logic to save watch path
      try {
        await invoke('start_watching', { path });
        alert('Watch path updated!');
      } catch (e) {
        alert('Failed to update path: ' + e);
      }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <button onClick={() => navigate('/dashboard')} className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition">
                <ArrowLeft size={20} /> Back to Dashboard
            </button>
            
            <div className="bg-gray-800 p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Settings</h1>
                
                <div className="mb-6">
                    <label className="block text-gray-400 mb-2">Watch Directory (Clip Studio Paint files)</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={path}
                            onChange={(e) => setPath(e.target.value)}
                            className="flex-1 bg-gray-700 p-2 rounded text-white"
                            placeholder="C:\Users\You\Documents\Art"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Enter the full path to the folder you want to monitor for .clip files.
                    </p>
                </div>

                <div className="flex justify-end">
                    <button 
                        onClick={handleSave}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2"
                    >
                        <Save size={20} /> Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
