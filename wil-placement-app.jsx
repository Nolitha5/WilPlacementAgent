import { useState, useEffect, useCallback } from "react";
import { supabase } from "./src/lib/supabase.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const skillMatch = (studentSkills = [], required = []) => {
  const have    = studentSkills.map(s => s.toLowerCase());
  const req     = required.map(s => s.toLowerCase());
  const matched = req.filter(r => have.includes(r));
  return { matched, total: req.length, percent: req.length ? Math.round((matched.length / req.length) * 100) : 0 };
};

const STATUS = {
  pending:   { label: "Pending",             bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-400" },
  interview: { label: "Interview Scheduled", bg: "bg-blue-100",  text: "text-blue-800",  dot: "bg-blue-500"  },
  declined:  { label: "Declined",            bg: "bg-red-100",   text: "text-red-700",   dot: "bg-red-500"   },
};

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Badge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {s.label}
    </span>
  );
}

function StatCard({ label, value, gradient }) {
  return (
    <div className={`rounded-2xl p-5 text-white shadow-lg bg-gradient-to-br ${gradient}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value ?? "—"}</p>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ConfirmModal({ message, sub, onConfirm, onCancel, confirmLabel = "Delete" }) {
  return (
    <Modal onClose={onCancel}>
      <div className="p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Ico.Trash className="w-5 h-5 text-red-600" />
        </div>
        <h3 className="font-bold text-gray-800 mb-1">{message}</h3>
        {sub && <p className="text-sm text-gray-500 mb-5">{sub}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel}  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold">{confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}

function Toast({ message, type = "success" }) {
  const colors = { success: "bg-green-600", error: "bg-red-600", info: "bg-indigo-600" };
  return (
    <div className={`fixed bottom-6 right-6 z-50 ${colors[type]} text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2`}>
      {type === "success" ? <Ico.Check className="w-4 h-4" /> : <Ico.X className="w-4 h-4" />}
      {message}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
}

function MatchBar({ percent }) {
  const color    = percent >= 70 ? "bg-green-500"  : percent >= 40 ? "bg-amber-400"  : "bg-red-400";
  const txtColor = percent >= 70 ? "text-green-600": percent >= 40 ? "text-amber-600": "text-red-500";
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Skills match</span>
        <span className={`font-semibold ${txtColor}`}>{percent}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const Ico = {
  Dashboard: ({ className = "w-5 h-5" }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2"/></svg>),
  Building:  ({ className = "w-5 h-5" }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="2"/><polyline points="9 22 9 12 15 12 15 22" strokeWidth="2"/></svg>),
  Briefcase: ({ className = "w-5 h-5" }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" strokeWidth="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" strokeWidth="2"/></svg>),
  List:      ({ className = "w-5 h-5" }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="8" y="2" width="8" height="4" rx="1" strokeWidth="2"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" strokeWidth="2"/><line x1="9" y1="12" x2="15" y2="12" strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="16" x2="13" y2="16" strokeWidth="2" strokeLinecap="round"/></svg>),
  Users:     ({ className = "w-5 h-5" }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4" strokeWidth="2"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" strokeWidth="2"/><path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87" strokeWidth="2" strokeLinecap="round"/></svg>),
  Plus:      ({ className = "w-5 h-5" }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round"/></svg>),
  Trash:     ({ className = "w-5 h-5" }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeWidth="2"/><path d="M10 11v6M14 11v6" strokeWidth="2" strokeLinecap="round"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeWidth="2"/></svg>),
  Eye:       ({ className = "w-5 h-5" }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2"/><circle cx="12" cy="12" r="3" strokeWidth="2"/></svg>),
  Check:     ({ className = "w-5 h-5" }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  X:         ({ className = "w-5 h-5" }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round"/></svg>),
  LogOut:    ({ className = "w-5 h-5" }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeWidth="2"/><polyline points="16 17 21 12 16 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" strokeWidth="2" strokeLinecap="round"/></svg>),
  MapPin:    ({ className = "w-4 h-4" }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeWidth="2"/><circle cx="12" cy="10" r="3" strokeWidth="2"/></svg>),
  Clock:     ({ className = "w-4 h-4" }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"/><polyline points="12 6 12 12 16 14" strokeWidth="2" strokeLinecap="round"/></svg>),
  Tag:       ({ className = "w-4 h-4" }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" strokeWidth="2"/><line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="2" strokeLinecap="round"/></svg>),
  Globe:     ({ className = "w-5 h-5" }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"/><line x1="2" y1="12" x2="22" y2="12" strokeWidth="2"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" strokeWidth="2"/></svg>),
  ExternalLink: ({ className = "w-4 h-4" }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" strokeWidth="2"/><polyline points="15 3 21 3 21 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="10" y1="14" x2="21" y2="3" strokeWidth="2" strokeLinecap="round"/></svg>),
  Search:    ({ className = "w-5 h-5" }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth="2"/><line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" strokeLinecap="round"/></svg>),
};

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const NAV = {
  admin:    [{ id:"dashboard", label:"Dashboard",         Icon:Ico.Dashboard }, { id:"employers", label:"Manage Employers", Icon:Ico.Building  }],
  student:  [{ id:"dashboard", label:"Dashboard",         Icon:Ico.Dashboard }, { id:"internships",label:"Available Internships",Icon:Ico.Briefcase },{ id:"opportunities",label:"Opportunities",Icon:Ico.Globe },{ id:"applications",label:"My Applications",Icon:Ico.List }],
  employer: [{ id:"dashboard", label:"Dashboard",         Icon:Ico.Dashboard }, { id:"post",      label:"Add Internship",   Icon:Ico.Plus      },{ id:"listings",label:"My Internships",Icon:Ico.Briefcase },{ id:"applicants",label:"View Applicants",Icon:Ico.Users }],
};

const THEME = {
  admin:    { from:"from-slate-800",   accent:"bg-slate-600",   ring:"bg-slate-500"   },
  student:  { from:"from-indigo-900",  accent:"bg-indigo-600",  ring:"bg-indigo-500"  },
  employer: { from:"from-emerald-900", accent:"bg-emerald-600", ring:"bg-emerald-500" },
};

function Sidebar({ role, profile, activePage, setActivePage, onLogout }) {
  const nav   = NAV[role] || [];
  const theme = THEME[role] || THEME.student;
  const initials = (profile?.name || "?").split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();
  return (
    <aside className={`w-64 ${theme.from} bg-gradient-to-b to-gray-900 text-white flex flex-col min-h-screen shrink-0`}>
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
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${theme.ring} flex items-center justify-center font-bold text-sm shrink-0`}>{initials}</div>
          <div className="overflow-hidden">
            <p className="font-semibold text-sm truncate">{profile?.name}</p>
            <p className="text-white/50 text-xs truncate">{profile?.email}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setActivePage(id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activePage === id ? `${theme.accent} text-white shadow` : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}>
            <Icon /> {label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all">
          <Ico.LogOut /> Sign Out
        </button>
      </div>
    </aside>
  );
}

const inputCls = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

function PageHeader({ title, sub }) {
  return <div className="mb-6"><h1 className="text-2xl font-bold text-gray-800">{title}</h1>{sub && <p className="text-gray-500 text-sm mt-1">{sub}</p>}</div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  AUTH SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Shared sign-in logic ─────────────────────────────────────────────────────

async function signIn(email, password) {
  const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
  if (err) throw new Error(err.message);
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
  if (!profile) throw new Error("Profile not found. Contact the administrator.");
  let extra = {};
  if (profile.role === "student") {
    const { data: s } = await supabase.from("students").select("*").eq("id", profile.id).single();
    extra = s || {};
  } else if (profile.role === "employer") {
    const { data: emp } = await supabase.from("employers").select("*").eq("id", profile.id).single();
    extra = emp || {};
  }
  return { ...profile, ...extra };
}

// ─── Landing page ─────────────────────────────────────────────────────────────

function LandingPage({ onSelectRole }) {
  const roles = [
    {
      id: "admin",
      emoji: "🛡️",
      title: "Administrator",
      desc: "Manage employer accounts and oversee the entire WIL placement system.",
      gradient: "from-slate-700 to-slate-900",
      border: "border-slate-200 hover:border-slate-400",
      btn: "bg-slate-800 hover:bg-slate-700",
    },
    {
      id: "student",
      emoji: "👨‍🎓",
      title: "Student",
      desc: "Browse available internships, apply to programmes, and track your application status.",
      gradient: "from-indigo-600 to-indigo-900",
      border: "border-indigo-200 hover:border-indigo-400",
      btn: "bg-indigo-600 hover:bg-indigo-700",
    },
    {
      id: "employer",
      emoji: "🏢",
      title: "Employer",
      desc: "Post internship programmes, review student applications, and schedule interviews.",
      gradient: "from-emerald-600 to-emerald-900",
      border: "border-emerald-200 hover:border-emerald-400",
      btn: "bg-emerald-700 hover:bg-emerald-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20">
          <svg className="w-11 h-11 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">WIL Placement Portal</h1>
        <p className="text-indigo-200 text-lg mb-2">Work Integrated Learning System</p>
        <p className="text-white/40 text-sm max-w-md">Connecting students with internship opportunities — bridging academia and industry.</p>

        {/* Role cards */}
        <div className="grid md:grid-cols-3 gap-5 mt-14 w-full max-w-4xl">
          {roles.map(r => (
            <div key={r.id} className={`bg-white/5 backdrop-blur-sm border ${r.border} rounded-2xl p-6 text-left transition-all duration-200 hover:bg-white/10 hover:scale-105 cursor-pointer group`}
              onClick={() => onSelectRole(r.id)}>
              <div className="text-4xl mb-4">{r.emoji}</div>
              <h2 className="text-white font-bold text-lg mb-2">{r.title}</h2>
              <p className="text-white/50 text-sm leading-relaxed mb-5">{r.desc}</p>
              <button className={`w-full py-2.5 ${r.btn} text-white rounded-xl text-sm font-semibold transition-all`}>
                {r.id === "student" ? "Sign In / Register" : "Sign In"} →
              </button>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-white/20 text-xs pb-6">© {new Date().getFullYear()} WIL Placement Portal · All rights reserved</p>
    </div>
  );
}

// ─── Admin login ──────────────────────────────────────────────────────────────

function AdminLoginScreen({ onAuth, onBack }) {
  const [email,    setEmail]    = useState("admin@wil.ac.za");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handle = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const profile = await signIn(email, password);
      if (profile.role !== "admin") { setError("This account is not an Admin account."); setLoading(false); return; }
      onAuth(profile);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-8 text-white text-center">
          <div className="text-4xl mb-3">🛡️</div>
          <h1 className="text-xl font-bold">Administrator Login</h1>
          <p className="text-white/60 text-sm mt-1">WIL Placement Portal</p>
        </div>
        <div className="p-8">
          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2"><Ico.X className="w-4 h-4 shrink-0"/>{error}</div>}
          <form onSubmit={handle} className="space-y-4">
            <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className={inputCls} /></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className={inputCls} /></div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all">
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>
          <button onClick={onBack} className="mt-4 w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-all">← Back to portal home</button>
        </div>
      </div>
    </div>
  );
}

// ─── Employer login ───────────────────────────────────────────────────────────

function EmployerLoginScreen({ onAuth, onBack }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleLogin = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const profile = await signIn(email, password);
      if (profile.role !== "employer") { setError("This account is not registered as an Employer."); setLoading(false); return; }
      onAuth(profile);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-900 p-8 text-white text-center">
          <div className="text-4xl mb-3">🏢</div>
          <h1 className="text-xl font-bold">Employer Portal</h1>
          <p className="text-white/60 text-sm mt-1">WIL Placement Portal</p>
        </div>
        <div className="p-8">
          <div className="mb-5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-xs text-emerald-700 font-medium">
            Your account is created by the Admin. Sign in with the credentials they provided.
          </div>

          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2"><Ico.X className="w-4 h-4 shrink-0"/>{error}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.co.za" className={inputCls} /></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className={inputCls} /></div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-semibold disabled:opacity-50 transition-all">
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>
          <button onClick={onBack} className="mt-4 w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-all">← Back to portal home</button>
        </div>
      </div>
    </div>
  );
}

// ─── Student login + register ─────────────────────────────────────────────────

function StudentAuthScreen({ onAuth, onBack }) {
  const [mode,     setMode]     = useState("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]     = useState("");
  const [major,    setMajor]    = useState("");
  const [year,     setYear]     = useState("1st Year");
  const [avgMark,  setAvgMark]  = useState("");
  const [skills,   setSkills]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleLogin = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const profile = await signIn(email, password);
      if (profile.role !== "student") { setError("This account is not a Student account."); setLoading(false); return; }
      onAuth(profile);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const handleRegister = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) throw new Error(err.message);
      const uid = data.user?.id;
      if (!uid) throw new Error("Registration failed — please try again.");
      await supabase.from("profiles").insert({ id: uid, role: "student", name, email });
      await supabase.from("students").insert({
        id: uid, major, year,
        average_mark: parseFloat(avgMark) || null,
        skills: skills.split(",").map(s => s.trim()).filter(Boolean),
      });
      onAuth({ id: uid, role: "student", name, email, major, year, average_mark: parseFloat(avgMark)||null, skills: skills.split(",").map(s=>s.trim()).filter(Boolean) });
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-800 to-indigo-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-900 p-8 text-white text-center">
          <div className="text-4xl mb-3">👨‍🎓</div>
          <h1 className="text-xl font-bold">Student Portal</h1>
          <p className="text-white/60 text-sm mt-1">WIL Placement Portal</p>
        </div>
        <div className="p-8">
          {/* Mode toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {[["login","Sign In"],["register","Register"]].map(([m,l]) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode===m ? "bg-white shadow text-indigo-700" : "text-gray-500 hover:text-gray-700"}`}>{l}</button>
            ))}
          </div>

          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2"><Ico.X className="w-4 h-4 shrink-0"/>{error}</div>}

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@student.ac.za" className={inputCls} /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className={inputCls} /></div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all">
                {loading ? "Signing in…" : "Sign In →"}
              </button>
              <p className="text-center text-xs text-gray-400">Don't have an account? Click <button type="button" onClick={()=>setMode("register")} className="text-indigo-600 font-semibold hover:underline">Register</button></p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                <input required value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. FiLo Cbia" className={inputCls} /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@student.ac.za" className={inputCls} /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Password *</label>
                <input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min. 6 characters" className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Major</label>
                  <input value={major} onChange={e=>setMajor(e.target.value)} placeholder="e.g. Computer Science" className={inputCls} /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Year</label>
                  <select value={year} onChange={e=>setYear(e.target.value)} className={inputCls}>
                    {["1st Year","2nd Year","3rd Year","4th Year","Honours"].map(y=><option key={y}>{y}</option>)}
                  </select></div>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Average Mark (%)</label>
                <input type="number" min="0" max="100" step="0.1" value={avgMark} onChange={e=>setAvgMark(e.target.value)} placeholder="e.g. 72" className={inputCls} /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Skills <span className="font-normal text-gray-400">(comma-separated)</span></label>
                <input value={skills} onChange={e=>setSkills(e.target.value)} placeholder="e.g. React, Python, SQL" className={inputCls} /></div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all">
                {loading ? "Creating account…" : "Create Account →"}
              </button>
              <p className="text-center text-xs text-gray-400">Already registered? <button type="button" onClick={()=>setMode("login")} className="text-indigo-600 font-semibold hover:underline">Sign In</button></p>
            </form>
          )}
          <button onClick={onBack} className="mt-4 w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-all">← Back to portal home</button>
        </div>
      </div>
    </div>
  );
}

// ─── AuthScreen router ────────────────────────────────────────────────────────

function AuthScreen({ onAuth }) {
  const [selectedRole, setSelectedRole] = useState(null); // null = landing

  if (!selectedRole)    return <LandingPage onSelectRole={setSelectedRole} />;
  if (selectedRole === "admin")    return <AdminLoginScreen    onAuth={onAuth} onBack={() => setSelectedRole(null)} />;
  if (selectedRole === "employer") return <EmployerLoginScreen onAuth={onAuth} onBack={() => setSelectedRole(null)} />;
  if (selectedRole === "student")  return <StudentAuthScreen  onAuth={onAuth} onBack={() => setSelectedRole(null)} />;
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN PAGES
// ═══════════════════════════════════════════════════════════════════════════════

function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("employers").select("id", { count:"exact", head:true }),
      supabase.from("internships").select("id", { count:"exact", head:true }),
      supabase.from("applications").select("id", { count:"exact", head:true }),
      supabase.from("students").select("id", { count:"exact", head:true }),
    ]).then(([e,i,a,s]) => {
      setStats({ employers: e.count, internships: i.count, applications: a.count, students: s.count });
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;
  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" sub="System overview — manage employers and monitor WIL activity." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Employers"    value={stats.employers}    gradient="from-slate-600 to-slate-800"     />
        <StatCard label="Students"     value={stats.students}     gradient="from-indigo-500 to-indigo-700"   />
        <StatCard label="Internships"  value={stats.internships}  gradient="from-emerald-500 to-emerald-700" />
        <StatCard label="Applications" value={stats.applications} gradient="from-blue-500 to-blue-700"       />
      </div>
    </div>
  );
}

function ManageEmployers() {
  const [employers,  setEmployers]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [form,       setForm]       = useState({ name:"", email:"", password:"", company:"", location:"" });
  const [saving,     setSaving]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast,      setToast]      = useState(null);

  const showToast = (msg, type="success") => { setToast({message:msg,type}); setTimeout(()=>setToast(null),3500); };

  const load = useCallback(async () => {
    setLoading(true);
    const { data: emp } = await supabase
      .from("employers")
      .select("id, company, location, profiles(name, email)")
      .order("created_at", { ascending: false });
    setEmployers(emp || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleAdd = async ev => {
    ev.preventDefault(); setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-employer", {
        body: {
          name: form.name,
          email: form.email.toLowerCase().trim(),
          password: form.password,
          company: form.company,
          location: form.location,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setForm({ name:"", email:"", password:"", company:"", location:"" });
      showToast(`Employer account created for ${form.company}. They can now sign in on the Employer portal.`);
      load();
    } catch (err) { showToast(err.message, "error"); }
    setSaving(false);
  };

  const handleDeleteEmployer = async id => {
    await supabase.from("employers").delete().eq("id", id);
    setConfirmDel(null); showToast("Employer removed."); load();
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}
      <PageHeader title="Manage Employers" sub="Register employer accounts. They can sign in immediately with the credentials you set." />

      {/* Add employer form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-700 mb-5 flex items-center gap-2">
          <Ico.Plus className="w-4 h-4" /> Register New Employer
        </h2>
        <form onSubmit={handleAdd} className="grid md:grid-cols-2 gap-4">
          {[
            ["Contact Name","name","e.g. Sarah Nkosi","text"],
            ["Contact Email","email","sarah@company.co.za","email"],
            ["Password","password","Min. 6 characters","password"],
            ["Company Name","company","e.g. TechSA Solutions","text"],
            ["Location","location","e.g. Johannesburg","text"],
          ].map(([label,key,placeholder,type]) => (
            <div key={key} className={key === "location" ? "md:col-span-2" : ""}>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label} *</label>
              <input required type={type} minLength={key==="password"?6:undefined}
                value={form[key]} onChange={set(key)} placeholder={placeholder} className={inputCls} />
            </div>
          ))}
          <div className="md:col-span-2">
            <button type="submit" disabled={saving}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              <Ico.Plus className="w-4 h-4" /> {saving ? "Creating account…" : "Create Employer Account"}
            </button>
          </div>
        </form>

        <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 space-y-1">
          <p className="font-semibold">How it works:</p>
          <p>Fill in the employer's details and set a password for them. Their account is created immediately — they just go to the Employer portal and sign in with these credentials.</p>
        </div>
      </div>

      {/* Registered employers */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Registered Employers ({employers.length})</h2>
        {loading ? <Spinner /> : employers.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">No employers registered yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {employers.map(e => (
              <div key={e.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">{e.company[0]}</div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{e.company}</p>
                    <p className="text-xs text-gray-500">{e.profiles?.name} · {e.profiles?.email}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Ico.MapPin />{e.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">Active</span>
                  <button onClick={() => setConfirmDel({ id: e.id })} className="p-1.5 text-red-400 hover:bg-red-50 rounded-xl"><Ico.Trash className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDel && (
        <ConfirmModal
          message="Remove this employer?"
          sub="Their listings and applications will also be removed."
          onConfirm={() => handleDeleteEmployer(confirmDel.id)}
          onCancel={() => setConfirmDel(null)}
          confirmLabel="Remove"
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  STUDENT PAGES
// ═══════════════════════════════════════════════════════════════════════════════

function StudentDashboard({ profile }) {
  const [stats, setStats]   = useState({});
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: apps } = await supabase
        .from("applications")
        .select("*, internships(internship_name, company_name)")
        .eq("student_id", profile.id)
        .order("created_at", { ascending: false });
      const all = apps || [];
      setStats({
        total:     all.length,
        pending:   all.filter(a => a.status === "pending").length,
        interview: all.filter(a => a.status === "interview").length,
        declined:  all.filter(a => a.status === "declined").length,
      });
      setRecent(all.slice(0, 4));
      setLoading(false);
    }
    load();
  }, [profile.id]);

  if (loading) return <Spinner />;
  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${(profile.name||"").split(" ")[0]} 👋`} sub="Track your WIL placements and discover internship opportunities." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Applied"    value={stats.total}     gradient="from-indigo-500 to-indigo-700"  />
        <StatCard label="Pending"    value={stats.pending}   gradient="from-amber-400 to-orange-500"   />
        <StatCard label="Interviews" value={stats.interview} gradient="from-blue-500 to-blue-700"      />
        <StatCard label="Declined"   value={stats.declined}  gradient="from-red-400 to-rose-600"       />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">My Profile</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Major</span><span className="font-medium">{profile.major || "—"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Year</span><span className="font-medium">{profile.year || "—"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Average Mark</span><span className="font-medium">{profile.average_mark != null ? `${profile.average_mark}%` : "—"}</span></div>
            <div className="pt-2"><p className="text-gray-500 mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {(profile.skills || []).map(s => <span key={s} className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-medium">{s}</span>)}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">Recent Applications</h2>
          {recent.length === 0 ? <p className="text-gray-400 text-sm">No applications yet.</p> : (
            <div className="space-y-3">
              {recent.map(a => (
                <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.internships?.internship_name}</p>
                    <p className="text-xs text-gray-400">{a.internships?.company_name} · {a.applied_date}</p>
                  </div>
                  <Badge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AvailableInternships({ profile }) {
  const [internships, setInternships] = useState([]);
  const [appliedIds,  setAppliedIds]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [type,        setType]        = useState("All");
  const [detail,      setDetail]      = useState(null);
  const [toast,       setToast]       = useState(null);

  const showToast = (message, t="success") => { setToast({message,type:t}); setTimeout(()=>setToast(null),3000); };

  useEffect(() => {
    async function load() {
      const [{ data: list }, { data: apps }] = await Promise.all([
        supabase.from("internships").select("*").order("created_at", { ascending: false }),
        supabase.from("applications").select("internship_id").eq("student_id", profile.id),
      ]);
      setInternships(list || []);
      setAppliedIds((apps || []).map(a => a.internship_id));
      setLoading(false);
    }
    load();
  }, [profile.id]);

  const handleApply = async id => {
    const { error } = await supabase.from("applications").insert({ student_id: profile.id, internship_id: id, status: "pending", applied_date: new Date().toISOString().split("T")[0] });
    if (error) { showToast(error.message, "error"); return; }
    setAppliedIds(prev => [...prev, id]);
    showToast("Application submitted!");
  };

  const filtered = internships.filter(i => {
    const q = search.toLowerCase();
    return (type === "All" || i.type === type) && (!q || i.internship_name.toLowerCase().includes(q) || i.company_name.toLowerCase().includes(q) || (i.skills_required||[]).some(s=>s.toLowerCase().includes(q)));
  });

  if (loading) return <Spinner />;
  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}
      <PageHeader title="Available Internships" sub={`${internships.length} programmes open for applications`} />
      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by title, company or skill…" className={`flex-1 min-w-48 ${inputCls}`} />
        {["All","Full-Time","Part-Time"].map(t => (
          <button key={t} onClick={() => setType(t)} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${type===t ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"}`}>{t}</button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(i => {
          const applied = appliedIds.includes(i.id);
          const req     = skillMatch(profile.skills || [], i.skills_required || []);
          return (
            <div key={i.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div><h3 className="font-semibold text-gray-800">{i.internship_name}</h3><p className="text-indigo-600 font-medium text-sm">{i.company_name}</p></div>
                <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${i.type==="Full-Time" ? "bg-indigo-100 text-indigo-700":"bg-purple-100 text-purple-700"}`}>{i.type}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1"><Ico.MapPin />{i.location}</span>
                <span className="flex items-center gap-1"><Ico.Clock />{i.duration}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(i.skills_required||[]).map(s => {
                  const have = (profile.skills||[]).map(x=>x.toLowerCase()).includes(s.toLowerCase());
                  return <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium ${have ? "bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>{s}</span>;
                })}
              </div>
              <div className="mb-4"><MatchBar percent={req.percent} /></div>
              <div className="flex gap-2 mt-auto">
                <button onClick={() => setDetail(i)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5">
                  <Ico.Eye className="w-4 h-4" /> Details
                </button>
                {applied ? (
                  <button disabled className="flex-1 py-2 bg-gray-100 text-gray-400 rounded-xl text-sm font-medium cursor-not-allowed">Applied ✓</button>
                ) : (
                  <button onClick={() => handleApply(i.id)} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all">Apply</button>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-16 text-gray-400 bg-white rounded-2xl">
            <Ico.Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No internships match your search.</p>
          </div>
        )}
      </div>
      {detail && (
        <Modal onClose={() => setDetail(null)}>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div><h2 className="text-xl font-bold text-gray-800">{detail.internship_name}</h2><p className="text-indigo-600 font-medium">{detail.company_name}</p></div>
              <button onClick={() => setDetail(null)} className="p-2 hover:bg-gray-100 rounded-xl"><Ico.X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{detail.description}</p>
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              {[["Type",detail.type],["Duration",detail.duration],["Location",detail.location,"col-span-2"]].map(([k,v,cls=""]) => (
                <div key={k} className={`bg-gray-50 rounded-xl p-3 ${cls}`}><p className="text-gray-400 text-xs">{k}</p><p className="font-semibold">{v}</p></div>
              ))}
            </div>
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Skills Required</p>
              <div className="flex flex-wrap gap-2">
                {(detail.skills_required||[]).map(s => {
                  const have = (profile.skills||[]).map(x=>x.toLowerCase()).includes(s.toLowerCase());
                  return <span key={s} className={`text-sm px-3 py-1 rounded-full font-medium flex items-center gap-1 ${have?"bg-green-100 text-green-700":"bg-red-50 text-red-600"}`}>{have?<Ico.Check className="w-3 h-3"/>:<Ico.X className="w-3 h-3"/>}{s}</span>;
                })}
              </div>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 mb-5"><MatchBar percent={skillMatch(profile.skills||[], detail.skills_required||[]).percent} /></div>
            <div className="flex gap-2">
              <button onClick={() => setDetail(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Close</button>
              {appliedIds.includes(detail.id) ? (
                <button disabled className="flex-1 py-2.5 bg-gray-100 text-gray-400 rounded-xl text-sm">Applied ✓</button>
              ) : (
                <button onClick={() => { handleApply(detail.id); setDetail(null); }} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">Apply Now</button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function MyApplications({ profile }) {
  const [apps,       setApps]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("all");
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast,      setToast]      = useState(null);

  const showToast = (message, t="success") => { setToast({message,type:t}); setTimeout(()=>setToast(null),3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("applications")
      .select("*, internships(internship_name, company_name, location, duration, type, skills_required)")
      .eq("student_id", profile.id)
      .order("created_at", { ascending: false });
    setApps(data || []);
    setLoading(false);
  }, [profile.id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async id => {
    await supabase.from("applications").delete().eq("id", id);
    setConfirmDel(null);
    showToast("Application withdrawn.");
    load();
  };

  const shown = filter === "all" ? apps : apps.filter(a => a.status === filter);

  if (loading) return <Spinner />;
  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}
      <PageHeader title="My Applications" sub={`${apps.length} application${apps.length!==1?"s":""} submitted`} />
      <div className="flex gap-2 flex-wrap">
        {[["all","All"],["pending","Pending"],["interview","Interview Scheduled"],["declined","Declined"]].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter===v ? "bg-indigo-600 text-white":"bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"}`}>{l}</button>
        ))}
      </div>
      {shown.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl"><Ico.List className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No applications found.</p></div>
      ) : (
        <div className="space-y-4">
          {shown.map(a => (
            <div key={a.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <div><h3 className="font-semibold text-gray-800">{a.internships?.internship_name}</h3><p className="text-indigo-600 text-sm font-medium">{a.internships?.company_name}</p></div>
                <Badge status={a.status} />
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-2">
                <span className="flex items-center gap-1"><Ico.MapPin />{a.internships?.location}</span>
                <span className="flex items-center gap-1"><Ico.Clock />{a.internships?.duration}</span>
                <span className="flex items-center gap-1"><Ico.Tag />{a.internships?.type}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(a.internships?.skills_required||[]).map(s=><span key={s} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{s}</span>)}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex flex-col gap-0.5">
                  <span>Applied: {a.applied_date}</span>
                  {a.status==="interview" && a.interview_date && <span className="text-blue-600 font-semibold">📅 Interview: {a.interview_date}</span>}
                  {a.note && <span className="italic">"{a.note}"</span>}
                </div>
                {a.status==="pending" && (
                  <button onClick={() => setConfirmDel(a.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-xl border border-red-100 text-xs font-medium transition-all">
                    <Ico.Trash className="w-3.5 h-3.5" /> Withdraw
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {confirmDel && (
        <ConfirmModal message="Withdraw this application?" sub="You can re-apply later."
          onConfirm={() => handleDelete(confirmDel)} onCancel={() => setConfirmDel(null)} confirmLabel="Withdraw" />
      )}
    </div>
  );
}

// ─── Opportunities (real SA jobs: curated + live API) ─────────────────────────

const CATEGORIES = ["All","Internship","WIL","Graduate","Junior","Entry Level"];

const CATEGORY_COLORS = {
  "Internship":   { bg:"bg-blue-100",    text:"text-blue-800"   },
  "WIL":          { bg:"bg-purple-100",  text:"text-purple-800" },
  "Graduate":     { bg:"bg-emerald-100", text:"text-emerald-800"},
  "Junior":       { bg:"bg-amber-100",   text:"text-amber-800"  },
  "Entry Level":  { bg:"bg-rose-100",    text:"text-rose-800"   },
};

// Curated real South African programmes
const CURATED_SA = [
  { id:"c1",  title:"Graduate Development Programme",       company:"ABSA Group",               location:"Johannesburg",  type:"Graduate",    duration:"24 months",  url:"https://www.absa.africa/absaafrica/careers/graduate-programme/",         logo:"🏦" },
  { id:"c2",  title:"FNB Graduate Programme",              company:"FNB (FirstRand)",           location:"Johannesburg",  type:"Graduate",    duration:"24 months",  url:"https://www.fnb.co.za/about-fnb/careers/graduates.html",                  logo:"🏦" },
  { id:"c3",  title:"Standard Bank Graduate Programme",    company:"Standard Bank",             location:"Johannesburg",  type:"Graduate",    duration:"24 months",  url:"https://www.standardbank.com/sbg/standard-bank-group/careers",            logo:"🏦" },
  { id:"c4",  title:"Deloitte Graduate Programme",         company:"Deloitte South Africa",     location:"Cape Town / JHB", type:"Graduate",  duration:"12 months",  url:"https://www2.deloitte.com/za/en/pages/careers/articles/graduates.html",   logo:"🔵" },
  { id:"c5",  title:"PwC Graduate Programme",              company:"PwC South Africa",          location:"Multiple cities", type:"Graduate",  duration:"12 months",  url:"https://www.pwc.co.za/en/careers/students-and-graduates.html",             logo:"🟠" },
  { id:"c6",  title:"KPMG Vacation Work & Graduate Prog.", company:"KPMG South Africa",         location:"Cape Town / JHB", type:"Graduate",  duration:"12 months",  url:"https://www.kpmg.com/za/en/home/careers/students.html",                   logo:"🔷" },
  { id:"c7",  title:"Eskom Internship Programme",          company:"Eskom",                     location:"Nationwide",    type:"Internship",  duration:"12 months",  url:"https://www.eskom.co.za/careers/",                                        logo:"⚡" },
  { id:"c8",  title:"MTN Graduate Programme",              company:"MTN South Africa",          location:"Johannesburg",  type:"Graduate",    duration:"12 months",  url:"https://www.mtn.com/mtn-careers/",                                        logo:"📡" },
  { id:"c9",  title:"Vodacom Graduate Programme",          company:"Vodacom",                   location:"Midrand",       type:"Graduate",    duration:"24 months",  url:"https://www.vodacom.com/careers.php",                                     logo:"📱" },
  { id:"c10", title:"Anglo American Graduate Programme",   company:"Anglo American",            location:"Johannesburg",  type:"Graduate",    duration:"24 months",  url:"https://www.angloamerican.com/careers/graduates",                         logo:"⛏️" },
  { id:"c11", title:"Sasol Graduate in Training",          company:"Sasol",                     location:"Secunda / JHB", type:"Graduate",    duration:"24 months",  url:"https://www.sasol.com/careers",                                          logo:"🔬" },
  { id:"c12", title:"Transnet National Ports Internship",  company:"Transnet",                  location:"Durban / Cape Town", type:"Internship", duration:"12 months", url:"https://www.transnet.net/Careers/Pages/Internship.aspx",             logo:"🚢" },
  { id:"c13", title:"SARS Graduate Recruitment",           company:"SARS",                      location:"Nationwide",    type:"Graduate",    duration:"12 months",  url:"https://www.sars.gov.za/about/careers/",                                  logo:"🏛️" },
  { id:"c14", title:"DBSA Graduate Programme",             company:"DBSA",                      location:"Midrand",       type:"Graduate",    duration:"24 months",  url:"https://www.dbsa.org/careers",                                           logo:"🏗️" },
  { id:"c15", title:"WIL Learnership Programme",           company:"Nedbank",                   location:"Johannesburg",  type:"WIL",         duration:"12 months",  url:"https://www.nedbank.co.za/content/nedbank/desktop/gt/en/personal/graduates.html", logo:"🟩" },
  { id:"c16", title:"Accenture Graduate Analyst",          company:"Accenture South Africa",    location:"Johannesburg",  type:"Graduate",    duration:"Permanent",  url:"https://www.accenture.com/za-en/careers",                                logo:"💜" },
  { id:"c17", title:"SAP Young Professional Programme",    company:"SAP Africa",                location:"Johannesburg",  type:"Entry Level", duration:"3 months",   url:"https://www.sap.com/africa/about/sap-africa/young-professional.html",     logo:"🔷" },
  { id:"c18", title:"Google Africa Developer Scholarship", company:"Google",                    location:"Remote",        type:"Entry Level", duration:"6 months",   url:"https://buildyourfuture.withgoogle.com/scholarships/google-africa-developer-scholarship", logo:"🌍" },
  { id:"c19", title:"Microsoft LEAP Apprenticeship",       company:"Microsoft",                 location:"Remote / JHB",  type:"Entry Level", duration:"18 months",  url:"https://www.microsoft.com/en-us/leap/",                                   logo:"🪟" },
  { id:"c20", title:"AWS re/Start Programme",              company:"Amazon Web Services",       location:"Cape Town / JHB", type:"Entry Level", duration:"3 months", url:"https://aws.amazon.com/training/restart/",                                logo:"☁️" },
  { id:"c21", title:"Investec Graduate Programme",         company:"Investec",                  location:"Cape Town / JHB", type:"Graduate",  duration:"24 months",  url:"https://www.investec.com/en_za/welcome-to-investec/careers.html",         logo:"🏦" },
  { id:"c22", title:"Old Mutual Graduate Programme",       company:"Old Mutual",                location:"Cape Town",     type:"Graduate",    duration:"24 months",  url:"https://www.oldmutual.co.za/careers/graduates/",                          logo:"🏢" },
  { id:"c23", title:"Capitec Bank Graduate Programme",     company:"Capitec Bank",              location:"Stellenbosch",  type:"Graduate",    duration:"12 months",  url:"https://www.capitecbank.co.za/about-us/careers/",                         logo:"🔴" },
  { id:"c24", title:"Shoprite Holdings Internship",        company:"Shoprite Group",            location:"Cape Town",     type:"Internship",  duration:"12 months",  url:"https://www.shoprite.co.za/careers/",                                     logo:"🛒" },
  { id:"c25", title:"Woolworths WIL Programme",            company:"Woolworths SA",             location:"Cape Town",     type:"WIL",         duration:"12 months",  url:"https://www.woolworthsholdings.co.za/our-people/careers/",                logo:"🛍️" },
  { id:"c26", title:"Pick n Pay WIL Placement",            company:"Pick n Pay",                location:"Cape Town",     type:"WIL",         duration:"12 months",  url:"https://www.pnp.co.za/pnpstorefront/pnp/en/Careers",                     logo:"🛒" },
  { id:"c27", title:"Telkom Graduate Programme",           company:"Telkom",                    location:"Pretoria",      type:"Graduate",    duration:"24 months",  url:"https://www.telkom.co.za/about/careers/",                                 logo:"📞" },
  { id:"c28", title:"Siemens SA Internship",               company:"Siemens South Africa",      location:"Johannesburg",  type:"Internship",  duration:"6 months",   url:"https://jobs.siemens.com/careers",                                        logo:"⚙️" },
  { id:"c29", title:"Junior Developer Programme",          company:"Rain",                      location:"Cape Town",     type:"Junior",      duration:"Permanent",  url:"https://www.rain.co.za/careers",                                          logo:"🌧️" },
  { id:"c30", title:"Hollard Graduate Development",        company:"Hollard Insurance",         location:"Johannesburg",  type:"Graduate",    duration:"24 months",  url:"https://www.hollard.co.za/careers/",                                      logo:"🏢" },
];

function Opportunities() {
  const [category,    setCategory]   = useState("All");
  const [search,      setSearch]     = useState("");
  const [liveJobs,    setLiveJobs]   = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError,   setLiveError]  = useState("");
  const [apiKey,      setApiKey]     = useState(import.meta.env.VITE_RAPIDAPI_KEY || "");
  const [showApiForm, setShowApiForm] = useState(false);
  const [apiInput,    setApiInput]   = useState("");

  // Fetch live jobs from JSearch (RapidAPI)
  const fetchLiveJobs = useCallback(async (key) => {
    if (!key) return;
    setLiveLoading(true); setLiveError("");
    try {
      const queries = ["internship south africa", "graduate programme south africa", "entry level south africa WIL"];
      const results = await Promise.all(queries.map(q =>
        fetch(`https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(q)}&num_pages=1&date_posted=month`, {
          headers: { "x-rapidapi-key": key, "x-rapidapi-host": "jsearch.p.rapidapi.com" },
        }).then(r => r.json())
      ));
      const seen = new Set();
      const jobs = results.flatMap(r => r.data || []).filter(j => {
        if (seen.has(j.job_id)) return false;
        seen.add(j.job_id); return true;
      }).map(j => ({
        id: j.job_id,
        title: j.job_title,
        company: j.employer_name,
        location: j.job_city ? `${j.job_city}, ${j.job_country}` : j.job_country,
        type: detectType(j.job_title),
        duration: j.job_employment_type || "Not specified",
        url: j.job_apply_link,
        logo: "🌐",
        live: true,
        posted: j.job_posted_at_datetime_utc,
      }));
      setLiveJobs(jobs);
    } catch (err) { setLiveError("Could not fetch live jobs. Check your API key."); }
    setLiveLoading(false);
  }, []);

  useEffect(() => { if (apiKey) fetchLiveJobs(apiKey); }, [apiKey, fetchLiveJobs]);

  function detectType(title = "") {
    const t = title.toLowerCase();
    if (t.includes("wil") || t.includes("work integrated")) return "WIL";
    if (t.includes("graduate") || t.includes("grad prog")) return "Graduate";
    if (t.includes("intern")) return "Internship";
    if (t.includes("junior") || t.includes("jr ")) return "Junior";
    return "Entry Level";
  }

  const allJobs = [...CURATED_SA, ...liveJobs];

  const filtered = allJobs.filter(j => {
    const matchCat = category === "All" || j.type === category;
    const q = search.toLowerCase();
    const matchSearch = !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.location.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const saveApiKey = () => { setApiKey(apiInput.trim()); setShowApiForm(false); };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Opportunities"
        sub="Real South African internships, WIL placements, graduate programmes and entry-level jobs."
      />

      {/* Live API banner */}
      {!apiKey ? (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-base mb-1">🔴 Live job feed not connected</p>
              <p className="text-white/80 text-sm">You're viewing {CURATED_SA.length} curated SA programmes. Connect a free RapidAPI key to also pull live listings from LinkedIn, Indeed &amp; more.</p>
              <a href="https://rapidapi.com/letscrape-6baf1323-b8e1-4e40-9e89-ca9f975ffdf4/api/jsearch" target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-all">
                Get free API key <Ico.ExternalLink />
              </a>
            </div>
            <button onClick={() => setShowApiForm(true)} className="shrink-0 bg-white text-indigo-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-indigo-50 transition-all">
              Connect
            </button>
          </div>
          {showApiForm && (
            <div className="mt-4 flex gap-2">
              <input value={apiInput} onChange={e => setApiInput(e.target.value)} placeholder="Paste your RapidAPI key…"
                className="flex-1 px-3 py-2 rounded-xl text-gray-800 text-sm focus:outline-none" />
              <button onClick={saveApiKey} className="bg-white text-indigo-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-indigo-50">Save</button>
              <button onClick={() => setShowApiForm(false)} className="text-white/60 hover:text-white text-sm px-2">Cancel</button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <p className="text-sm text-emerald-800 font-medium">
            {liveLoading ? "Fetching live listings…" : liveError ? `⚠️ ${liveError}` : `Live feed connected · ${liveJobs.length} live + ${CURATED_SA.length} curated listings`}
          </p>
          <button onClick={() => { setApiKey(""); setLiveJobs([]); }} className="ml-auto text-xs text-gray-400 hover:text-red-500">Disconnect</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Ico.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, company or location…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${category === c ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">{filtered.length} opportunit{filtered.length === 1 ? "y" : "ies"} found</p>

      {/* Job cards */}
      {liveLoading && liveJobs.length === 0 ? <Spinner /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(job => {
            const cat = CATEGORY_COLORS[job.type] || { bg:"bg-gray-100", text:"text-gray-700" };
            return (
              <div key={job.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl shrink-0">{job.logo}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm leading-snug">{job.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{job.company}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${cat.bg} ${cat.text}`}>{job.type}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Ico.MapPin />{job.location}</span>
                  <span className="flex items-center gap-1"><Ico.Clock />{job.duration}</span>
                  {job.live && <span className="flex items-center gap-1 text-emerald-600 font-medium">● Live</span>}
                </div>
                <a href={job.url} target="_blank" rel="noreferrer"
                  className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all">
                  View &amp; Apply <Ico.ExternalLink />
                </a>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && !liveLoading && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium">No opportunities match your search.</p>
          <p className="text-sm mt-1">Try a different category or clear your search.</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  EMPLOYER PAGES
// ═══════════════════════════════════════════════════════════════════════════════

function EmployerDashboard({ profile }) {
  const [stats, setStats]   = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: listings } = await supabase.from("internships").select("id").eq("employer_id", profile.id);
      const ids = (listings||[]).map(i=>i.id);
      const { count: appCount } = ids.length
        ? await supabase.from("applications").select("id",{count:"exact",head:true}).in("internship_id", ids)
        : { count: 0 };
      const { count: pending }   = ids.length ? await supabase.from("applications").select("id",{count:"exact",head:true}).in("internship_id",ids).eq("status","pending")   : {count:0};
      const { count: interview } = ids.length ? await supabase.from("applications").select("id",{count:"exact",head:true}).in("internship_id",ids).eq("status","interview") : {count:0};
      setStats({ listings: listings?.length||0, applications: appCount||0, pending: pending||0, interviews: interview||0 });
      setLoading(false);
    }
    load();
  }, [profile.id]);

  if (loading) return <Spinner />;
  return (
    <div className="space-y-6">
      <PageHeader title="Employer Dashboard" sub={`${profile.company || ""} · ${profile.location || ""}`} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="My Listings"    value={stats.listings}     gradient="from-emerald-500 to-emerald-700" />
        <StatCard label="Total Applicants" value={stats.applications} gradient="from-indigo-500 to-indigo-700"   />
        <StatCard label="Interviews"     value={stats.interviews}   gradient="from-blue-500 to-blue-700"       />
        <StatCard label="Pending Review" value={stats.pending}      gradient="from-amber-400 to-orange-500"    />
      </div>
    </div>
  );
}

function AddInternship({ profile }) {
  const [form, setForm]     = useState({ internshipName:"", type:"Full-Time", location:"", duration:"", description:"", skillsInput:"" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState(null);

  const showToast = (message, t="success") => { setToast({message,type:t}); setTimeout(()=>setToast(null),3000); };
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from("internships").insert({
      employer_id:     profile.id,
      company_name:    profile.company,
      internship_name: form.internshipName,
      type:            form.type,
      location:        form.location,
      duration:        form.duration,
      description:     form.description,
      skills_required: form.skillsInput.split(",").map(s=>s.trim()).filter(Boolean),
      posted_date:     new Date().toISOString().split("T")[0],
    });
    if (error) { showToast(error.message, "error"); } else {
      setForm({ internshipName:"", type:"Full-Time", location:"", duration:"", description:"", skillsInput:"" });
      showToast("Internship posted successfully!");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {toast && <Toast {...toast} />}
      <PageHeader title="Add Internship Programme" sub="Create a new listing for students to discover and apply to." />
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Name</label><input value={profile.company||""} disabled className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`} /></div>
        <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Internship Name *</label><input required value={form.internshipName} onChange={set("internshipName")} placeholder="e.g. Frontend Developer Intern" className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Type *</label>
            <select value={form.type} onChange={set("type")} className={inputCls}><option>Full-Time</option><option>Part-Time</option></select>
          </div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Duration *</label><input required value={form.duration} onChange={set("duration")} placeholder="e.g. 6 Months" className={inputCls} /></div>
        </div>
        <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Location *</label><input required value={form.location} onChange={set("location")} placeholder="e.g. Cape Town (Hybrid)" className={inputCls} /></div>
        <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Skills Required * <span className="font-normal text-gray-400">(comma-separated)</span></label><input required value={form.skillsInput} onChange={set("skillsInput")} placeholder="e.g. React, JavaScript, Node.js" className={inputCls} /></div>
        <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label><textarea value={form.description} onChange={set("description")} rows={3} placeholder="Describe the role…" className={`${inputCls} resize-none`} /></div>
        <button type="submit" disabled={saving} className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50">
          <Ico.Plus className="w-4 h-4" /> {saving ? "Posting…" : "Post Internship"}
        </button>
      </form>
    </div>
  );
}

function MyInternships({ profile }) {
  const [listings,   setListings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast,      setToast]      = useState(null);

  const showToast = (message, t="success") => { setToast({message,type:t}); setTimeout(()=>setToast(null),3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("internships").select("*").eq("employer_id", profile.id).order("created_at",{ascending:false});
    setListings(data||[]);
    setLoading(false);
  }, [profile.id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async id => {
    await supabase.from("internships").delete().eq("id", id);
    setConfirmDel(null);
    showToast("Listing removed.");
    load();
  };

  if (loading) return <Spinner />;
  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}
      <PageHeader title="My Internships" sub={`${listings.length} active listing${listings.length!==1?"s":""}`} />
      {listings.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl"><Ico.Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No listings yet.</p></div>
      ) : (
        <div className="space-y-4">
          {listings.map(i => (
            <div key={i.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <div><h3 className="font-semibold text-gray-800">{i.internship_name}</h3><p className="text-emerald-700 font-medium text-sm">{i.company_name}</p></div>
                <button onClick={() => setConfirmDel(i.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-xl"><Ico.Trash className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1"><Ico.Tag />{i.type}</span>
                <span className="flex items-center gap-1"><Ico.MapPin />{i.location}</span>
                <span className="flex items-center gap-1"><Ico.Clock />{i.duration}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(i.skills_required||[]).map(s=><span key={s} className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">{s}</span>)}
              </div>
              {i.description && <p className="text-xs text-gray-400 mt-3">{i.description}</p>}
            </div>
          ))}
        </div>
      )}
      {confirmDel && (
        <ConfirmModal message="Remove this listing?" sub="All related applications will also be removed."
          onConfirm={() => handleDelete(confirmDel)} onCancel={() => setConfirmDel(null)} confirmLabel="Remove" />
      )}
    </div>
  );
}

function ViewApplicants({ profile }) {
  const [listings,  setListings]  = useState([]);
  const [apps,      setApps]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filterL,   setFilterL]   = useState("all");
  const [filterS,   setFilterS]   = useState("all");
  const [selected,  setSelected]  = useState(null);
  const [iDate,     setIDate]     = useState("");
  const [note,      setNote]      = useState("");
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState(null);

  const showToast = (message, t="success") => { setToast({message,type:t}); setTimeout(()=>setToast(null),3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const { data: myListings } = await supabase.from("internships").select("*").eq("employer_id", profile.id);
    setListings(myListings||[]);
    const ids = (myListings||[]).map(i=>i.id);
    if (ids.length) {
      const { data: myApps } = await supabase
        .from("applications")
        .select("*, internships(internship_name, skills_required), students(major,year,gpa,skills,profiles(name,email))")
        .in("internship_id", ids)
        .order("created_at", { ascending: false });
      setApps(myApps||[]);
    }
    setLoading(false);
  }, [profile.id]);

  useEffect(() => { load(); }, [load]);

  const handleRespond = async (id, status) => {
    setSaving(true);
    await supabase.from("applications").update({ status, interview_date: status==="interview"?iDate:null, note }).eq("id", id);
    setSelected(null); setIDate(""); setNote("");
    showToast(status==="interview" ? "Interview scheduled!" : "Application declined.");
    load(); setSaving(false);
  };

  const shown = apps.filter(a =>
    (filterL==="all" || a.internship_id===filterL) &&
    (filterS==="all" || a.status===filterS)
  );

  if (loading) return <Spinner />;
  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}
      <PageHeader title="View Applicants" sub={`${apps.length} application${apps.length!==1?"s":""} across your listings`} />
      <div className="flex gap-3 flex-wrap">
        <select value={filterL} onChange={e=>setFilterL(e.target.value)} className={`${inputCls} w-auto`}>
          <option value="all">All Listings</option>
          {listings.map(i=><option key={i.id} value={i.id}>{i.internship_name}</option>)}
        </select>
        {[["all","All"],["pending","Pending"],["interview","Interview"],["declined","Declined"]].map(([v,l]) => (
          <button key={v} onClick={() => setFilterS(v)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterS===v ? "bg-emerald-700 text-white":"bg-white border border-gray-200 text-gray-600 hover:border-emerald-300"}`}>{l}</button>
        ))}
      </div>
      {shown.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl"><Ico.Users className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No applicants found.</p></div>
      ) : (
        <div className="space-y-4">
          {shown.map(a => {
            const student   = a.students || {};
            const sProfile  = student.profiles || {};
            const req       = skillMatch(student.skills||[], a.internships?.skills_required||[]);
            return (
              <div key={a.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-blue-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {(sProfile.name||"?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{sProfile.name}</p>
                      <p className="text-xs text-gray-500">{student.major} · {student.year} · Avg {student.average_mark != null ? `${student.average_mark}%` : "—"}</p>
                    </div>
                  </div>
                  <Badge status={a.status} />
                </div>
                <p className="text-xs text-emerald-700 font-semibold mb-2">Applied for: {a.internships?.internship_name}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(student.skills||[]).map(s => {
                    const match = (a.internships?.skills_required||[]).map(r=>r.toLowerCase()).includes(s.toLowerCase());
                    return <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium ${match?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>{s}</span>;
                  })}
                </div>
                <div className="mb-2"><MatchBar percent={req.percent} /></div>
                {req.percent < 100 && (
                  <p className="text-xs text-red-500 mb-2">Missing: {(a.internships?.skills_required||[]).filter(r=>!(student.skills||[]).map(s=>s.toLowerCase()).includes(r.toLowerCase())).join(", ")}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    Applied: {a.applied_date}
                    {a.interview_date && <span className="ml-2 text-blue-600 font-semibold">📅 {a.interview_date}</span>}
                    {a.note && <span className="ml-2 italic">· {a.note}</span>}
                  </div>
                  {a.status==="pending" && (
                    <button onClick={() => setSelected(a)} className="px-4 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-600 transition-all">Respond</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <div className="p-6">
            <div className="flex justify-between items-start mb-5">
              <div><h2 className="text-lg font-bold text-gray-800">Respond to Application</h2>
                <p className="text-sm text-gray-500">{selected.students?.profiles?.name} · {selected.internships?.internship_name}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-xl"><Ico.X className="w-4 h-4" /></button>
            </div>
            {(() => { const r = skillMatch(selected.students?.skills||[], selected.internships?.skills_required||[]); return (
              <div className={`rounded-xl p-4 mb-4 ${r.percent>=70?"bg-green-50":"bg-amber-50"}`}>
                <p className="text-sm font-semibold text-gray-700 mb-1">Match: {r.percent}%</p>
                <p className="text-xs text-gray-500">Student has {r.matched.length} of {r.total} required skills.</p>
              </div>
            ); })()}
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Interview Date <span className="font-normal text-gray-400">(required to schedule)</span></label>
                <input type="date" value={iDate} onChange={e=>setIDate(e.target.value)} className={inputCls} /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Note to Student <span className="font-normal text-gray-400">(optional)</span></label>
                <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} placeholder="e.g. Interview via Zoom, bring portfolio." className={`${inputCls} resize-none`} /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setSelected(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleRespond(selected.id,"declined")} disabled={saving}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5">
                <Ico.X className="w-4 h-4" /> Decline
              </button>
              <button onClick={() => handleRespond(selected.id,"interview")} disabled={!iDate||saving}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-1.5">
                <Ico.Check className="w-4 h-4" /> Schedule
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [profile,    setProfile]    = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [booting,    setBooting]    = useState(true);

  // Restore session on page refresh
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
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

  if (!profile) return <AuthScreen onAuth={p => { setProfile(p); setActivePage("dashboard"); }} />;

  const role = profile.role;

  const renderPage = () => {
    if (role === "admin") {
      if (activePage === "dashboard") return <AdminDashboard />;
      if (activePage === "employers") return <ManageEmployers adminProfile={profile} />;
    }
    if (role === "student") {
      if (activePage === "dashboard")    return <StudentDashboard profile={profile} />;
      if (activePage === "internships")   return <AvailableInternships profile={profile} />;
      if (activePage === "opportunities") return <Opportunities />;
      if (activePage === "applications")  return <MyApplications profile={profile} />;
    }
    if (role === "employer") {
      if (activePage === "dashboard")  return <EmployerDashboard profile={profile} />;
      if (activePage === "post")       return <AddInternship profile={profile} />;
      if (activePage === "listings")   return <MyInternships profile={profile} />;
      if (activePage === "applicants") return <ViewApplicants profile={profile} />;
    }
    return null;
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar role={role} profile={profile} activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout} />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">{renderPage()}</div>
      </main>
    </div>
  );
}
