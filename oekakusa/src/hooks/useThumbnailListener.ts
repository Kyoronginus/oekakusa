import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { readFile } from '@tauri-apps/plugin-fs';
import { auth, db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Commit, UserData } from './useDashboardData';

export const useThumbnailListener = (isTauri: boolean) => {
  const user = auth.currentUser;

  useEffect(() => {
    if (!user || !isTauri) return;

    let unlistenFn: (() => void) | undefined;

    const setupListener = async () => {
      try {
        console.log("Attempting to listen to 'thumbnail-generated'...");
        
        unlistenFn = await listen('thumbnail-generated', async (event: any) => {
          const payload = event.payload;
          console.log('Thumbnail generated:', payload);
          
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
              const yesterdayStr = yesterday.toISOString().split('T')[0];

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
      } catch (err) {
        console.error("Failed to setup listener:", err);
      }
    };

    setupListener();

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, [user, isTauri]);
};
