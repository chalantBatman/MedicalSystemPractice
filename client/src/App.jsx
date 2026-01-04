import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth";
import { RequireRole } from "./guards";

import LoginPage from "./pages/LoginPage";
import PatientsPage from "./pages/PatientsPage";
import PatientDetailPage from "./pages/PatientDetailPage";
import RegisterPage from "./pages/RegisterPage";
import AdminCreateUserPage from "./pages/AdminCreateUserPage";
import PatientHomePage from "./pages/PatientHomePage";
import DoctorHomePage from "./pages/DoctorHomePage";
import StaffHomePage from "./pages/StaffHomePage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/"
            element={
              <RequireRole roles={["staff", "doctor"]}>
                <PatientsPage />
              </RequireRole>
            }
          />

          <Route
            path="/patients/:id"
            element={
              <RequireRole roles={["staff", "doctor", "patient"]}>
                <PatientDetailPage />
              </RequireRole>
            }
            />

            <Route
              path="/admin/create-user"
              element={
                <RequireRole roles={["staff"]}>
                  <AdminCreateUserPage />
                </RequireRole>
              }
            />

            <Route
              path="/patient"
              element={
                <RequireRole roles={["patient"]}>
                  <PatientHomePage />
                </RequireRole>
              }
            />

            <Route
              path="/doctor"
              element={
                <RequireRole roles={["doctor"]}>
                  <DoctorHomePage />
                </RequireRole>
              }
            />

            <Route
              path="/staff"
              element={
                <RequireRole roles={["staff"]}>
                  <StaffHomePage />
                </RequireRole>
              }
            />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

