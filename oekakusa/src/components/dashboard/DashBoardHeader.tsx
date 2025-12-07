import React from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { Activity, Film, Settings, LogOut, User } from "lucide-react";
import { useDashboardAuth } from "../../utils/handleAuth";

interface DashboardHeaderProps {
  setShowExportModal: (show: boolean) => void;
  setShowAnalysisModal: (show: boolean) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  setShowExportModal,
  setShowAnalysisModal,
}) => {
  const navigate = useNavigate();
  const { handleLogout } = useDashboardAuth();
  const user = auth.currentUser;

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
      {/* Left Side: Profile Image + Title/Welcome */}
      <div className="flex items-center gap-4 w-full md:w-auto">
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
          <div className="text-gray-500 text-sm hidden sm:block">
            Welcome,{" "}
            <span className="text-primary font-bold">
              {user?.displayName || "Artist"}
            </span>
          </div>
        </div>
      </div>

      {/* Right Side: Buttons */}
      <div className="flex flex-wrap gap-2 md:gap-4 justify-center md:justify-end w-full md:w-auto">
        {/* <button
          onClick={handleCheckNetwork}
          className="p-2 bg-secondary/10 text-secondary rounded hover:bg-secondary/20 flex items-center gap-2 transition text-sm sm:text-base"
          title="Test Network"
        >
          <Activity size={18} />{" "}
          <span className="hidden sm:inline">Test Net</span>
        </button> */}

        <button
          onClick={() => setShowExportModal(true)}
          className="p-2 bg-primary/10 text-primary rounded hover:bg-primary/20 flex items-center gap-2 transition text-sm sm:text-base"
          title="Export GIF"
        >
          <Film size={18} />{" "}
          <span className="hidden sm:inline">Export GIF</span>
        </button>

        <button
          onClick={() => setShowAnalysisModal(true)}
          className="p-2 bg-primary/10 text-primary rounded hover:bg-primary/20 flex items-center gap-2 transition text-sm sm:text-base"
          title="Analyze Art"
        >
          <Activity size={18} />{" "}
          <span className="hidden sm:inline">Analyze</span>
        </button>

        <div className="flex gap-2 border-l pl-2 border-gray-200">
          <button
            onClick={() => navigate("/settings")}
            className="p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 text-gray-500 hover:text-primary transition"
            title="Watch Settings"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 text-gray-500 hover:text-primary transition"
            title="Profile"
          >
            <User size={18} />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 bg-red-50 text-red-500 border border-red-100 rounded hover:bg-red-100 transition"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
