/**
 * src/pages/auth/LandingPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Role-selection landing screen — first thing users see.
 */

export function LandingPage({ onSelectRole }) {
  const roles = [
    { id:"admin",    emoji:"🛡️", title:"Administrator", desc:"Manage employer accounts and oversee the entire WIL placement system.",                      gradient:"from-slate-700 to-slate-900",   border:"border-slate-200 hover:border-slate-400",   btn:"bg-slate-800 hover:bg-slate-700"  },
    { id:"student",  emoji:"👨‍🎓", title:"Student",       desc:"Browse available internships, apply to programmes, and track your application status.",      gradient:"from-indigo-600 to-indigo-900", border:"border-indigo-200 hover:border-indigo-400", btn:"bg-indigo-600 hover:bg-indigo-700" },
    { id:"employer", emoji:"🏢", title:"Employer",      desc:"Post internship programmes, review student applications, and schedule interviews.",          gradient:"from-emerald-600 to-emerald-900",border:"border-emerald-200 hover:border-emerald-400",btn:"bg-emerald-700 hover:bg-emerald-600"},
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex flex-col">
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

        <div className="grid md:grid-cols-3 gap-5 mt-14 w-full max-w-4xl">
          {roles.map(r => (
            <div
              key={r.id}
              className={`bg-white/5 backdrop-blur-sm border ${r.border} rounded-2xl p-6 text-left transition-all duration-200 hover:bg-white/10 hover:scale-105 cursor-pointer group`}
              onClick={() => onSelectRole(r.id)}
            >
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
