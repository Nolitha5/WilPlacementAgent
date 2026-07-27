/**
 * src/App.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Root application component.
 *  - Restores Supabase session on page refresh.
 *  - Routes between the auth screens and the role dashboards.
 *  - Passes setActivePage down so child pages can navigate (e.g. MyApplications → internships).
 *
 * Role routing:
 *   admin    → AdminDashboard | ManageEmployers | WILMatching
 *   student  → StudentDashboard | AvailableInternships | MyApplications | Opportunities | CareerNews
 *   employer → EmployerDashboard | AddInternship | MyInternships | ViewApplicants
 */
import { useState, useEffect } from "react";
import { supabase }            from "./lib/supabase";

// Auth
import { AuthScreen }          from "./pages/auth/AuthScreen";

// Layout
import { Sidebar }             from "./components/layout/Sidebar";

// Admin pages
import { AdminDashboard }      from "./pages/admin/AdminDashboard";
import { ManageEmployers }     from "./pages/admin/ManageEmployers";
import { WILMatching }         from "./pages/admin/WILMatching";

// Student pages
import { StudentDashboard }    from "./pages/student/StudentDashboard";
import { AvailableInternships }from "./pages/student/AvailableInternships";
import { MyApplications }      from "./pages/student/MyApplications";
import { Opportunities }       from "./pages/student/Opportunities";
// CareerNews removed — re-add when ready

// Employer pages
import { EmployerDashboard }   from "./pages/employer/EmployerDashboard";
import { AddInternship }       from "./pages/employer/AddInternship";
import { MyInternships }       from "./pages/employer/MyInternships";
import { ViewApplicants }      from "./pages/employer/ViewApplicants";

export default function App() {
  const [profile,    setProfile]    = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [booting,    setBooting]    = useState(true);

  // ── Restore session on page refresh ─────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (prof) {
          let extra = {};
          if (prof.role === "student") {
            const { data: s } = await supabase.from("students").select("*").eq("id", prof.id).single();
            extra = s || {};
          } else if (prof.role === "employer") {
            const { data: emp } = await supabase.from("employers").select("*").eq("id", prof.id).single();
            extra = emp || {};
          }
          setProfile({ ...prof, ...extra });
        }
      }
      setBooting(false);
    });

    // Sign out when auth state is cleared (e.g. token expiry)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setProfile(null); setActivePage("dashboard"); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setActivePage("dashboard");
  };

  // ── Boot spinner ─────────────────────────────────────────────────────────────
  if (booting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading WIL Placement Portal…</p>
        </div>
      </div>
    );
  }

  // ── Not authenticated ─────────────────────────────────────────────────────────
  if (!profile) {
    return <AuthScreen onAuth={p => { setProfile(p); setActivePage("dashboard"); }} />;
  }

  // ── Page router ──────────────────────────────────────────────────────────────
  const role = profile.role;

  const renderPage = () => {
    // Admin
    if (role === "admin") {
      if (activePage === "dashboard") return <AdminDashboard />;
      if (activePage === "employers") return <ManageEmployers adminProfile={profile} />;
      if (activePage === "matching")  return <WILMatching />;
    }
    // Student
    if (role === "student") {
      if (activePage === "dashboard")    return <StudentDashboard profile={profile} />;
      if (activePage === "internships")  return <AvailableInternships profile={profile} />;
      if (activePage === "applications") return <MyApplications profile={profile} onNavigate={setActivePage} />;
      if (activePage === "opportunities")return <Opportunities />;

    }
    // Employer
    if (role === "employer") {
      if (activePage === "dashboard")  return <EmployerDashboard profile={profile} />;
      if (activePage === "post")       return <AddInternship profile={profile} />;
      if (activePage === "listings")   return <MyInternships profile={profile} />;
      if (activePage === "applicants") return <ViewApplicants profile={profile} />;
    }
    return null;
  };

  // ── Authenticated layout ──────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar
        role={role}
        profile={profile}
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={handleLogout}
      />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">{renderPage()}</div>
      </main>
    </div>
  );
}
