import React from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { Activity, Film, Settings, LogOut, User } from "lucide-react";
import { useDashboardAuth } from "../../utils/handleAuth";

interface DashboardHeaderProps {
  setShowExportModal: (show: boolean) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  setShowExportModal,
}) => {
  const navigate = useNavigate();
  const { handleLogout, handleCheckNetwork } = useDashboardAuth();
  const user = auth.currentUser;

  return (
    <div className="flex justify-between items-center mb-8">
      {/* Left Side: Profile Image + Title/Welcome */}
      <div className="flex items-center gap-4">
        <img
          src={user?.photoURL || "https://placehold.co/150?text=Avatar"}
          alt="Profile"
          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow-sm"
          onError={(e) =>
            (e.currentTarget.src = "https://placehold.co/150?text=Avatar")
          }
        />
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold flex items-center gap-2 text-primary">
            Dashboard
          </h1>
          <p className="text-gray-500 text-sm">
            {new Date().toLocaleDateString()}
          </p>
          <p className="text-gray-500 text-sm">
            Welcome,{" "}
            <span className="text-primary font-bold">
              {user?.displayName || "Artist"}
            </span>
          </p>
        </div>
      </div>

      {/* Right Side: Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleCheckNetwork}
          className="p-2 bg-secondary/10 text-secondary rounded hover:bg-secondary/20 flex items-center gap-2 transition"
          title="Test Network"
        >
          <Activity size={20} /> Test Net
        </button>

        <button
          onClick={() => setShowExportModal(true)}
          className="p-2 bg-primary/10 text-primary rounded hover:bg-primary/20 flex items-center gap-2 transition"
          title="Export GIF"
        >
          <Film size={20} /> Export GIF
        </button>

        <button
          onClick={() => navigate("/settings")}
          className="p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 text-gray-500 hover:text-primary transition"
          title="Watch Settings"
        >
          <Settings size={20} />
        </button>
        <button
          onClick={() => navigate("/profile")}
          className="p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 text-gray-500 hover:text-primary transition"
          title="Profile"
        >
          <User size={20} />
        </button>
        <button
          onClick={handleLogout}
          className="p-2 bg-red-50 text-red-500 border border-red-100 rounded hover:bg-red-100 transition"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
