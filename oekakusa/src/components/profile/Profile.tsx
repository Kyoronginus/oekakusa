import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, storage } from "../../firebase";
import { updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ArrowLeft, User, Save, Camera, KeyRound } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc } from "@tauri-apps/api/core";
import { readFile } from "@tauri-apps/plugin-fs";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  // @ts-ignore
  const isTauri = !!(window.__TAURI__ || window.__TAURI_INTERNALS__);

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPhotoURL(user.photoURL || "");
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    setMessage(null);

    try {
      let finalPhotoURL = photoURL;

      if (selectedFilePath) {
        // Read local file
        const fileBytes = await readFile(selectedFilePath);

        // Create storage ref
        // Match the security rule: match /users/{userId}/{allPaths=**}
        const storageRef = ref(
          storage,
          `users/${user.uid}/profile_images/avatar`
        );

        // Upload
        await uploadBytes(storageRef, fileBytes);

        // Get URL
        finalPhotoURL = await getDownloadURL(storageRef);
      }

      await updateProfile(user, {
        displayName,
        photoURL: finalPhotoURL,
      });

      setPhotoURL(finalPhotoURL);
      setSelectedFilePath(null);

      setMessage({ text: "Profile updated successfully!", type: "success" });
    } catch (error: any) {
      console.error(error);
      setMessage({ text: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    if (!confirm(`Send password reset email to ${user.email}?`)) return;

    try {
      await sendPasswordResetEmail(auth, user.email);
      setMessage({ text: "Password reset email sent!", type: "success" });
    } catch (error: any) {
      setMessage({ text: error.message, type: "error" });
    }
  };

  const handlePhotoPick = async () => {
    if (!isTauri) {
      const url = prompt("Enter Image URL");
      if (url) {
        setPhotoURL(url);
        setSelectedFilePath(null);
      }
      return;
    }

    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Images",
            extensions: ["png", "jpg", "jpeg", "webp"],
          },
        ],
      });
      if (selected) {
        const path = selected as string;
        setSelectedFilePath(path);
        setPhotoURL(convertFileSrc(path)); // Preview locally
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-surface p-8 text-text">
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-6 flex items-center gap-2 text-text-muted hover:text-primary transition"
      >
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div className="bg-background p-8 rounded-xl shadow-lg max-w-xl mx-auto border border-gray-100">
        <h1 className="text-3xl font-bold mb-6 text-primary flex items-center gap-2">
          <User className="text-secondary" /> Edit Profile
        </h1>

        {message && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex flex-col items-center mb-8">
          <div
            className="relative group cursor-pointer"
            onClick={handlePhotoPick}
          >
            <img
              src={photoURL || "https://placehold.co/150?text=Avatar"}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-secondary shadow-md"
              onError={(e) =>
                (e.currentTarget.src = "https://placehold.co/150?text=Avatar")
              }
            />
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <Camera className="text-white" />
            </div>
          </div>
          <p className="text-sm text-text-muted mt-2">Click to change photo</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition bg-surface"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4">
          <button
            onClick={handleUpdateProfile}
            disabled={loading}
            className={`w-full bg-primary hover:bg-primary-dark text-black font-bold py-3 rounded-lg shadow-md transition flex items-center justify-center gap-2 ${
              loading ? "opacity-70" : ""
            }`}
          >
            <Save size={20} /> {loading ? "Saving..." : "Save Changes"}
          </button>

          <button
            onClick={handlePasswordReset}
            className="w-full bg-primary hover:bg-primary-dark text-red-500 font-bold py-3 rounded-lg shadow-md transition flex items-center justify-center gap-2"
          >
            <KeyRound size={20} /> Reset Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
