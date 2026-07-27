/**
 * src/pages/auth/AuthScreen.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Routes to the correct login/register screen based on role selection.
 */
import { useState }              from "react";
import { LandingPage }           from "./LandingPage";
import { AdminLoginScreen }      from "./AdminLoginScreen";
import { EmployerLoginScreen }   from "./EmployerLoginScreen";
import { StudentAuthScreen }     from "./StudentAuthScreen";

export function AuthScreen({ onAuth }) {
  const [selectedRole, setSelectedRole] = useState(null);

  if (!selectedRole)               return <LandingPage          onSelectRole={setSelectedRole} />;
  if (selectedRole === "admin")    return <AdminLoginScreen     onAuth={onAuth} onBack={() => setSelectedRole(null)} />;
  if (selectedRole === "employer") return <EmployerLoginScreen  onAuth={onAuth} onBack={() => setSelectedRole(null)} />;
  if (selectedRole === "student")  return <StudentAuthScreen    onAuth={onAuth} onBack={() => setSelectedRole(null)} />;
  return null;
}
