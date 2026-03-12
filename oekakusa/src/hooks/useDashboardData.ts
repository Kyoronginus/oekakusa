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
  storage_path?: string;
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

      // Auto-recalculate lost XP and Streak if user document was reset
      if (fetchedCommits.length > 0) {
        // If xp is 0 (or less than it should be) despite having commits, we fix it
        const expectedXp = fetchedCommits.length * 100;

        // Only run this recalculation if xp is legitimately wrong by a lot (e.g. 0)
        // We do this by checking the current state xp or reading the doc once.
        // It's safer to just do a one-off check when commits load
        import("firebase/firestore").then(async ({ getDoc, updateDoc }) => {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const currentXp = data.xp || 0;
            if (currentXp === 0 && expectedXp > 0) {
              console.log("Recalculating lost user data from commits...");
              // Calculate streak from history
              let calculatedStreak = 0;
              let lastRecordDate = null;

              // fetchedCommits is ordered by timestamp desc
              const todayStr = getLocalYYYYMMDD();
              const datesAsc = fetchedCommits
                .map(c => getLocalYYYYMMDD(new Date(c.timestamp * 1000)))
                .reverse(); // oldest to newest

              // simple streak calculation
              for (const d of datesAsc) {
                if (!lastRecordDate) {
                  calculatedStreak = 1;
                  lastRecordDate = d;
                } else if (d !== lastRecordDate) {
                  const prevDate = new Date(lastRecordDate);
                  const currDate = new Date(d);
                  const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  if (diffDays === 1) {
                    calculatedStreak += 1;
                  } else {
                    calculatedStreak = 1; // broken streak
                  }
                  lastRecordDate = d;
                }
              }

              // If last commit wasn't today or yesterday, streak is actually 0 now
              if (lastRecordDate) {
                const todayDate = new Date(todayStr);
                const lastDateObj = new Date(lastRecordDate);
                const diffTime = Math.abs(todayDate.getTime() - lastDateObj.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > 1) {
                  calculatedStreak = 0;
                }
              }

              await updateDoc(userDocRef, {
                xp: expectedXp,
                streak: calculatedStreak,
                lastCommitDate: fetchedCommits[0] ? getLocalYYYYMMDD(new Date(fetchedCommits[0].timestamp * 1000)) : null
              });
            }
          }
        });
      }
    });

    return () => {
      unsubUser();
      unsubCommits();
    };
  }, [user]);

  return { commits, xp, streak, heatmapValues };
};
