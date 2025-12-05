import React, { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { convertFileSrc } from '@tauri-apps/api/core';
import { readFile } from '@tauri-apps/plugin-fs';
import ContributionGraph from './ContributionGraph';
import { Settings, LogOut, Activity, Flame, Zap, Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { invoke } from '@tauri-apps/api/core';

interface Commit {
  id?: string;
  path: string;
  thumbnail_path: string;
  timestamp: number;
  thumbnail_url?: string;
}

interface UserData {
  xp: number;
  streak: number;
  lastCommitDate: string | null;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [commits, setCommits] = useState<Commit[]>([]);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [heatmapValues, setHeatmapValues] = useState<{ date: string; count: number }[]>([]);

  const [gifLoading, setGifLoading] = useState(false);
  const [isTauri, setIsTauri] = useState(false);

  const user = auth.currentUser;

  useEffect(() => {
    // Check if running in Tauri
    // @ts-ignore
    const isTauriCheck = !!(window.__TAURI__ || window.__TAURI_INTERNALS__);
    setIsTauri(isTauriCheck);
    console.log("Is Tauri environment:", isTauriCheck);
  }, []);

  // Real-time Listeners
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    const commitsQuery = query(collection(db, "users", user.uid, "commits"), orderBy("timestamp", "desc"));

    // Listener for User Stats
    const unsubUser = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data() as UserData;
            setXp(data.xp || 0);
            setStreak(data.streak || 0);
        } else {
             // Initialize new user if needed, or handle in a separate init logic
             setDoc(userDocRef, { xp: 0, streak: 0, lastCommitDate: null }).catch(console.error);
        }
    });

    // Listener for Commits
    const unsubCommits = onSnapshot(commitsQuery, (snapshot) => {
        const fetchedCommits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commit));
        setCommits(fetchedCommits);

        // Recalculate Heatmap
        const counts: { [key: string]: number } = {};
        fetchedCommits.forEach(c => {
            const date = new Date(c.timestamp * 1000).toISOString().split('T')[0];
            counts[date] = (counts[date] || 0) + 1;
        });
        setHeatmapValues(Object.entries(counts).map(([date, count]) => ({ date, count })));
    });

    return () => {
        unsubUser();
        unsubCommits();
    };
  }, [user]);

  // Listen for new commits
  useEffect(() => {
    if (!user || !isTauri) return;

    // DEBUG: Test basic IPC
    console.log('Window keys:', Object.keys(window));
    // @ts-ignore
    console.log('__TAURI__:', window.__TAURI__);

    invoke('greet', { name: 'Debugger' })
      .then(console.log)
      .catch((e) => console.error('Greet failed:', e));

    let unlistenFn: (() => void) | undefined;

const setupListener = async () => {
    try {
      console.log("Attempting to listen to 'thumbnail-generated'...");
      
      unlistenFn = await listen('thumbnail-generated', async (event: any) => {
        const payload = event.payload;
        console.log('Thumbnail generated:', payload);
        
        // ✅ FIX: Define 'today' at the very top level of the callback
        // This ensures it is visible to ALL try/catch blocks below
        const today = new Date().toISOString().split('T')[0];

        // --- 1. Upload to Storage ---
        let downloadURL = "";
        try {
          console.log("Reading thumbnail file:", payload.thumbnail_path);
          const fileBytes = await readFile(payload.thumbnail_path);
          
          const storageRef = ref(storage, `users/${user.uid}/thumbnails/${payload.timestamp}_${payload.thumbnail_path.split(/[\\/]/).pop()}`);
          
          await uploadBytes(storageRef, fileBytes);
          downloadURL = await getDownloadURL(storageRef);
          console.log("Upload success, URL:", downloadURL);
        } catch (uploadErr) {
          console.error("Failed to upload thumbnail:", uploadErr);
          // We continue even if upload fails, just without a URL
        }

        const newCommit: Commit = {
          path: payload.original_file,
          thumbnail_path: payload.thumbnail_path,
          timestamp: payload.timestamp,
          thumbnail_url: downloadURL
        };

        // --- 2. Update Firestore ---
        try {
          // Add Commit to Sub-collection
          await addDoc(collection(db, "users", user.uid, "commits"), newCommit);

          // Get User Stats
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          
          let currentStreak = 0;
          let lastDate = null;
          let currentXP = 0;

          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            currentStreak = data.streak || 0;
            lastDate = data.lastCommitDate;
            currentXP = data.xp || 0;
          }

          // Streak Logic
          let newStreak = currentStreak;
          
          // Check if we have already committed today to avoid double counting streak
          if (lastDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastDate === yesterdayStr) {
              newStreak += 1;
            } else {
              newStreak = 1; // Reset streak if missed a day
            }
          }
          
          // Update User Doc
          await updateDoc(userDocRef, {
            xp: currentXP + 100,
            streak: newStreak,
            lastCommitDate: today // ✅ 'today' is now guaranteed to be defined
          });
          
          console.log("Commit saved effectively!");
        } catch (dbError) {
           console.error("Failed to save commit to Firestore:", dbError);
        }
      });
    } catch (err) {
      console.error("Failed to setup listener:", err);
    }
  };

    setupListener();

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, [user, isTauri]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const handleCheckNetwork = async () => {
    try {
      const response = await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' });
      alert('Network Check: SUCCESS (Reached Google)');
    } catch (e) {
      alert('Network Check: FAILED ' + e);
    }
  };

  const handleExportGif = async () => {
    setGifLoading(true);
    try {
      if (!isTauri) {
        alert("GIF Export is only available in Tauri desktop app.");
        return;
      }
      const imagePaths = [...commits]
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(c => c.thumbnail_path);

      if (imagePaths.length === 0) {
        alert("No commits to export!");
        setGifLoading(false);
        return;
      }

      const result = await invoke('export_gif', { imagePaths });
      alert(`GIF Exported: ${result}`);
    } catch (error) {
      console.error(error);
      alert(`Failed to export GIF: ${error}`);
    } finally {
      setGifLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Tauri Warning Banner */}
      {!isTauri && (
        <div className="bg-yellow-600 text-white p-4 rounded-lg mb-8 flex items-center gap-3">
          <Zap className="text-yellow-300" />
          <div>
            <p className="font-bold">Browser Mode Detected</p>
            <p className="text-sm">Tauri backend features (file watching, thumbnails) are disabled. Please run in the Tauri App window.</p>
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
            onClick={handleExportGif} 
            disabled={gifLoading}
            className={`p-2 bg-purple-600 rounded hover:bg-purple-500 flex items-center gap-2 ${gifLoading ? 'opacity-50' : ''}`}
          >
            <Film size={20} /> {gifLoading ? 'Exporting...' : 'Export GIF'}
          </button>
          <button onClick={() => navigate('/settings')} className="p-2 bg-gray-800 rounded hover:bg-gray-700">
            <Settings size={20} />
          </button>
          <button onClick={handleLogout} className="p-2 bg-red-900 rounded hover:bg-red-800">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
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
            <p className="text-2xl font-bold">
              {heatmapValues.find(v => v.date === new Date().toISOString().split('T')[0])?.count || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Contribution Graph */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Activity</h2>
        <ContributionGraph values={heatmapValues} />
      </div>

      {/* Recent Commits */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Recent Commits</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {commits.map((commit, index) => {
            console.log(`Commit ${index}:`, commit);
            return (
            <div key={index} className="bg-gray-700 rounded-lg overflow-hidden group relative">
              <img 
                src={commit.thumbnail_url || (isTauri ? convertFileSrc(commit.thumbnail_path) : "https://placehold.co/400x300?text=Web+View")} 
                alt="Thumbnail" 
                className="w-full h-32 object-cover"
                onError={(e) => {
                  console.error("Image load failed:", commit.path);
                  e.currentTarget.src = "https://placehold.co/400x300?text=Broken+Link";
                }}
              />
              <div className="p-2">
                <p className="text-xs text-gray-300 truncate" title={commit.path}>
                  {commit.path.split(/[\\/]/).pop()}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(commit.timestamp * 1000).toLocaleTimeString()}
                </p>
              </div>
            </div>
          );
          })}
          {commits.length === 0 && (
            <p className="text-gray-500 col-span-full text-center py-8">
              No commits yet. Start drawing!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
