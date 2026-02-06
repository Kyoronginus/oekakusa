import { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export type UserSettings = {
  watchPaths?: string[];
  exportPath?: string | null;
  snapshotInterval?: number;
  confirmKanbanDelete?: boolean;
};

export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings>({
    confirmKanbanDelete: true, // Default to true
  });
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserSettings;
        setSettings((prev) => ({
          ...prev, // Keep defaults if not present
          ...data,
          // Ensure defaults if specific fields are missing in DB but present in type
          confirmKanbanDelete:
            data.confirmKanbanDelete !== undefined
              ? data.confirmKanbanDelete
              : true,
        }));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid), newSettings, { merge: true });
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  return { settings, updateSettings, loading };
};
