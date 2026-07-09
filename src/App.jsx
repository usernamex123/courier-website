import { Routes, Route, Navigate } from "react-router-dom";
import { useApp } from "./contexts/AppContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Shipping from "./pages/Shipping";
import Quote from "./pages/Quote";
import TrackingPage from "./pages/Tracking";

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useApp();
  return isLoggedIn ? children : <Navigate to="/auth" replace />;
}

function PublicRoute({ children }) {
  const { isLoggedIn } = useApp();
  return !isLoggedIn ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <div className="bg-slate-950 min-h-screen text-white font-sans antialiased overflow-x-hidden selection:bg-blue-500/30 selection:text-blue-200">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quote" element={<Quote />} />
        <Route path="/tracking" element={<TrackingPage />} />
        <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/shipping" element={<ProtectedRoute><Shipping /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}