import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

export const useDashboardAuth = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

  const handleCheckNetwork = async () => {
    try {
      await fetch("https://www.google.com/favicon.ico", { mode: "no-cors" });
      alert("Network Check: SUCCESS");
    } catch (e) {
      alert("Network Check: FAILED " + e);
    }
  };

  return { handleLogout, handleCheckNetwork };
};
