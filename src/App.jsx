import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import MonitoringPage from "./pages/MonitoringPage";
import ConfigurationPage from "./pages/ConfigurationPage";
import AddPatient from "./pages/AddPatient"; // 👈 Agregado
import ProtectedRoute from "./components/ProtectedRoute";
import AddUser from "./pages/AddUser";


function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="emobosque-theme">
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/monitoring"
            element={
              <ProtectedRoute>
                <MonitoringPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuration"
            element={
              <ProtectedRoute>
                <ConfigurationPage />
              </ProtectedRoute>
            }
          />
          <Route
  path="/add-patient"
  element={
    <ProtectedRoute>
      <AddPatient />
    </ProtectedRoute>
  }
/>
<Route path="/add-user" element={    <ProtectedRoute>
  <AddUser />
            
              </ProtectedRoute>
            } />


          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
