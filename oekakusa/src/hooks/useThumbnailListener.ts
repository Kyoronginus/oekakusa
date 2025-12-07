import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { readFile } from '@tauri-apps/plugin-fs';
import { auth, db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Commit, UserData } from './useDashboardData';
import { getLocalYYYYMMDD } from '../utils/dateUtils';

export const useThumbnailListener = (isTauri: boolean) => {
  const user = auth.currentUser;

  useEffect(() => {
    if (!user || !isTauri) return;

    let unlistenFn: (() => void) | undefined;
    let isMounted = true;

    const setupListener = async () => {
      try {
        console.log("Attempting to listen to 'thumbnail-generated'...");
        
        const unlisten = await listen('thumbnail-generated', async (event: any) => {
          if (!isMounted) return; // ignore events if unmounted (Zombie check)
          
          const payload = event.payload;
          console.log('Thumbnail generated:', payload);
          
          const today = getLocalYYYYMMDD();

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
          }

          const newCommit: Commit = {
            path: payload.original_file,
            thumbnail_path: payload.thumbnail_path,
            timestamp: payload.timestamp,
            thumbnail_url: downloadURL
          };

          // --- 2. Update Firestore ---
          try {
            await addDoc(collection(db, "users", user.uid, "commits"), newCommit);

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

            let newStreak = currentStreak;
            
            if (lastDate !== today) {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = getLocalYYYYMMDD(yesterday);

              if (lastDate === yesterdayStr) {
                newStreak += 1;
              } else {
                newStreak = 1; // Reset streak
              }
            }
            
            await updateDoc(userDocRef, {
              xp: currentXP + 100,
              streak: newStreak,
              lastCommitDate: today
            });
            
            console.log("Commit saved effectively!");
          } catch (dbError) {
             console.error("Failed to save commit to Firestore:", dbError);
          }
        });

        if (isMounted) {
            unlistenFn = unlisten;
        } else {
            // If strictly unmounted before promise resolved, immediately unlisten
            unlisten();
        }

      } catch (err) {
        console.error("Failed to setup listener:", err);
      }
    };

    setupListener();

    return () => {
      isMounted = false;
      if (unlistenFn) unlistenFn();
    };
  }, [user, isTauri]);
};
