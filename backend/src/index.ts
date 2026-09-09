// import * as functions from 'firebase-functions';
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import express, { Request, Response } from 'express';
import cors from 'cors';

admin.initializeApp();

const app = express();
// Automatically allow cross-origin requests from any website
app.use(cors({ origin: true }));

const db = admin.firestore();

// 1. Fetch all commits without images for a specific user
app.get('/users/:userId/commits', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const snapshot = await db.collection('users')
                             .doc(userId)
                             .collection('commits')
                             .orderBy('timestamp', 'desc')
                             .limit(100)
                             .get();

    const commits = snapshot.docs.map(doc => {
      const data = doc.data();
      // Exclude large image data fields to keep payload small
      const { thumbnail_full_path, thumbnail_small_path, thumbnail_url, ...rest } = data;
      return { id: doc.id, ...rest };
    });

    res.json(commits);
  } catch (error) {
    console.error("Error fetching commits:", error);
    res.status(500).send("Internal Server Error");
  }
});

// 2. Fetch latest commit with image for a specific user
app.get('/users/:userId/commits/latest', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const snapshot = await db.collection('users')
                             .doc(userId)
                             .collection('commits')
                             .orderBy('timestamp', 'desc')
                             .limit(1)
                             .get();

    if (snapshot.empty) {
      res.status(404).send("No commits found");
      return;
    }

    const doc = snapshot.docs[0];
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Error fetching latest commit:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Export the Express API as a Firebase Cloud Function
export const api = onRequest({ cors: true }, app);

