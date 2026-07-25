import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Analytics from "./pages/Analytics";
import Auth from "./pages/Auth";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "#0b0f17" }}>
        <p style={{ color: "#94a3b8" }}>Checking authentication...</p>
      </div>
    );
  }

  // if user is not logged in, redirect to auth page
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "#0b0f17" }}>
        <p style={{ color: "#94a3b8" }}>Initializing application...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route 
          path="/analytics"   //only for logged in users
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
