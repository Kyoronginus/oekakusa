import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, collection, query, orderBy, onSnapshot, setDoc } from 'firebase/firestore';
import { getLocalYYYYMMDD } from '../utils/dateUtils';

export interface Commit {
  id?: string;
  path: string;
  thumbnail_path: string;
  timestamp: number;
  thumbnail_url?: string;
}

export interface UserData {
  xp: number;
  streak: number;
  lastCommitDate: string | null;
}

export const useDashboardData = () => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [heatmapValues, setHeatmapValues] = useState<{ date: string; count: number }[]>([]);
  const user = auth.currentUser;

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
            const date = getLocalYYYYMMDD(new Date(c.timestamp * 1000));
            counts[date] = (counts[date] || 0) + 1;
        });
        setHeatmapValues(Object.entries(counts).map(([date, count]) => ({ date, count })));
    });

    return () => {
        unsubUser();
        unsubCommits();
    };
  }, [user]);

  return { commits, xp, streak, heatmapValues };
};
