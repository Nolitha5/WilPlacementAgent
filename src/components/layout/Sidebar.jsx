/**
 * src/components/layout/Sidebar.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Role-aware navigation sidebar.
 * The NAV_KEYS config drives which items appear; icons are mapped here so that
 * constants.js stays free of JSX/React imports.
 */

import { Ico }       from "../icons/Icons";
import { NAV_KEYS, THEME } from "../../utils/constants";

// Map nav IDs → icon components (keeps constants.js a plain JS module)
const NAV_ICONS = {
  dashboard:    Ico.Dashboard,
  employers:    Ico.Building,
  matching:     Ico.Search,
  internships:  Ico.Briefcase,
  opportunities:Ico.Globe,
  applications: Ico.List,
  news:         Ico.Newspaper,
  post:         Ico.Plus,
  listings:     Ico.Briefcase,
  applicants:   Ico.Users,
};

export function Sidebar({ role, profile, activePage, setActivePage, onLogout }) {
  const nav     = NAV_KEYS[role] || [];
  const theme   = THEME[role]    || THEME.student;
  const initials = (profile?.name || "?")
    .split(" ")
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className={`w-64 ${theme.from} bg-gradient-to-b to-gray-900 text-white flex flex-col min-h-screen shrink-0`}>

      {/* Logo / portal name */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 ${theme.accent} rounded-xl flex items-center justify-center`}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm">WIL Placement</p>
            <p className="text-white/50 text-xs capitalize">{role} Portal</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${theme.ring} flex items-center justify-center font-bold text-sm shrink-0`}>
            {initials}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-sm truncate">{profile?.name}</p>
            <p className="text-white/50 text-xs truncate">{profile?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ id, label }) => {
          const Icon = NAV_ICONS[id] || Ico.Dashboard;
          return (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activePage === id
                  ? `${theme.accent} text-white shadow`
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon /> {label}
            </button>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all"
        >
          <Ico.LogOut /> Sign Out
        </button>
      </div>
    </aside>
  );
}
