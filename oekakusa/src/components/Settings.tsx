import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FolderPlus, FilePlus, Trash2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [paths, setPaths] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const user = auth.currentUser;

    useEffect(() => {
        const loadSettings = async () => {
            if (!user) return;
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    if (data.watchPaths) {
                        setPaths(data.watchPaths);
                         // Sync backend just in case
                        await invoke('update_watch_paths', { paths: data.watchPaths });
                    }
                }
            } catch (e) {
                console.error("Failed to load settings:", e);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, [user]);

    const handleAddFolder = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
            });
            if (selected) {
                 // @ts-ignore
                if (!paths.includes(selected)) {
                     // @ts-ignore
                    setPaths([...paths, selected]);
                }
            }
        } catch (e) {
            console.error(e);
            alert('Failed to open dialog: ' + e);
        }
    };

    const handleAddFile = async () => {
        try {
            const selected = await open({
                directory: false,
                multiple: false,
                filters: [{
                    name: 'Clip Studio Paint',
                    extensions: ['clip']
                }]
            });
            if (selected) {
                 // @ts-ignore
                if (!paths.includes(selected)) {
                     // @ts-ignore
                    setPaths([...paths, selected]);
                }
            }
        } catch (e) {
            console.error(e);
             alert('Failed to open dialog: ' + e);
        }
    };

    const handleRemovePath = (pathToRemove: string) => {
        setPaths(paths.filter(p => p !== pathToRemove));
    };

    const handleSave = async () => {
        if (!user) return;
        try {
            setLoading(true);
            // 1. Save to Firestore
            await setDoc(doc(db, "users", user.uid), {
                watchPaths: paths
            }, { merge: true });

            // 2. Update Rust Backend
            await invoke('update_watch_paths', { paths });
            
            alert('Settings saved and watchers updated!');
        } catch (e) {
            console.error(e);
            alert('Failed to save settings: ' + e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <button onClick={() => navigate('/dashboard')} className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition">
                <ArrowLeft size={20} /> Back to Dashboard
            </button>
            
            <div className="bg-gray-800 p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Watch Settings</h1>
                
                <div className="mb-6">
                    <p className="text-gray-400 mb-4">
                        Add folders or specific files to monitor. Oekakusa will track any changes to `.clip` files in these locations.
                    </p>

                    <div className="flex gap-4 mb-4">
                        <button 
                            onClick={handleAddFolder}
                            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition"
                        >
                            <FolderPlus size={18} /> Add Folder
                        </button>
                        <button 
                            onClick={handleAddFile}
                            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition"
                        >
                            <FilePlus size={18} /> Add File
                        </button>
                    </div>

                    <div className="space-y-2 bg-gray-900 p-4 rounded-lg min-h-[100px]">
                        {paths.length === 0 && <p className="text-gray-600 italic">No paths added yet.</p>}
                        {paths.map((p, i) => (
                            <div key={i} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                                <span className="truncate text-sm font-mono text-gray-300" title={p}>{p}</span>
                                <button 
                                    onClick={() => handleRemovePath(p)}
                                    className="text-red-400 hover:text-red-300 p-1"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className={`bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2 ${loading ? 'opacity-50' : ''}`}
                    >
                        <Save size={20} /> {loading ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
