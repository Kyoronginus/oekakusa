import { useState, useEffect, useRef } from "react";
import { db, auth } from "../firebase";
import {
  doc,
  collection,
  query,
  orderBy,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { getLocalYYYYMMDD } from "../utils/dateUtils";

export interface Commit {
  id?: string;
  path: string;
  thumbnail_path: string;
  thumbnail_small_path?: string;
  thumbnail_full_path?: string;
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
  const [heatmapValues, setHeatmapValues] = useState<
    { date: string; count: number }[]
  >([]);
  const user = auth.currentUser;

  const lastSyncedSettings = useRef<string>("");

  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    const commitsQuery = query(
      collection(db, "users", user.uid, "commits"),
      orderBy("timestamp", "desc")
    );

    // Listener for User Stats & Sync Watcher
    const unsubUser = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setXp(data.xp || 0);
        setStreak(data.streak || 0);

        // Sync Watcher if on Tauri
        // @ts-ignore
        if (window.__TAURI__ || window.__TAURI_INTERNALS__) {
          if (data.watchPaths) {
            const settingsFingerprint = JSON.stringify({
              p: data.watchPaths,
              i: data.snapshotInterval || 5,
            });

            if (lastSyncedSettings.current !== settingsFingerprint) {
              try {
                const { invoke } = await import("@tauri-apps/api/core");
                await invoke("update_watch_paths", {
                  paths: data.watchPaths,
                  interval: data.snapshotInterval || 5,
                });
                console.log("Watchers synced from dashboard", data.watchPaths);
                lastSyncedSettings.current = settingsFingerprint;
              } catch (e) {
                console.error("Failed to sync watchers:", e);
              }
            }
          }
        }
      } else {
        // Initialize new user if needed
        setDoc(userDocRef, { xp: 0, streak: 0, lastCommitDate: null }).catch(
          console.error
        );
      }
    });

    // Listener for Commits
    const unsubCommits = onSnapshot(commitsQuery, (snapshot) => {
      const fetchedCommits = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Commit)
      );
      setCommits(fetchedCommits);

      // Recalculate Heatmap
      const counts: { [key: string]: number } = {};
      fetchedCommits.forEach((c) => {
        const date = getLocalYYYYMMDD(new Date(c.timestamp * 1000));
        counts[date] = (counts[date] || 0) + 1;
      });
      setHeatmapValues(
        Object.entries(counts).map(([date, count]) => ({ date, count }))
      );
    });

    return () => {
      unsubUser();
      unsubCommits();
    };
  }, [user]);

  return { commits, xp, streak, heatmapValues };
};
