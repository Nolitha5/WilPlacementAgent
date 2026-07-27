/**
 * src/pages/admin/WILMatching.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * AI-assisted WIL matching: mock students vs both mock + live internships.
 *
 * To replace mock students with real data:
 *   1. Remove MOCK_STUDENTS / MOCK_STUDENT_SKILLS from matchingEngine.js
 *   2. Fetch from supabase.from("students").select(...) here
 *   3. Pass the live data to runMatching() and matchStudentToLive()
 */
import { useState, useEffect }                      from "react";
import { supabase }                                 from "../../lib/supabase";
import { Ico }                                      from "../../components/icons/Icons";
import { Spinner, PageHeader }                      from "../../components/ui";
import { runMatching, matchStudentToLive, MOCK_STUDENTS } from "../../utils/matchingEngine";

export function WILMatching() {
  const [filter,      setFilter]      = useState("all");
  const [search,      setSearch]      = useState("");
  const [copied,      setCopied]      = useState(null);
  const [liveJobs,    setLiveJobs]    = useState([]);
  const [liveLoading, setLiveLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("internships")
      .select("*, employers(company, location)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setLiveJobs(
          (data || []).map(i => ({
            id:             "live_" + i.id,
            employerId:     i.employer_id,
            title:          i.internship_name,
            programme:      null,
            faculty:        null,
            location:       i.location,
            durationMonths: i.duration || "—",
            minimumAverage: null,
            skillsRequired: i.skills_required || [],
            company:        i.company_name || i.employers?.company || "Unknown",
            isLive:         true,
          }))
        );
        setLiveLoading(false);
      });
  }, []);

  const allResults = [
    ...runMatching(),
    ...(!liveLoading
      ? MOCK_STUDENTS.flatMap(s => liveJobs.map(i => matchStudentToLive(s, i)))
      : []),
  ].sort((a, b) => b.score - a.score || b.student.average - a.student.average);

  const shown = allResults.filter(r => {
    const matchFilter = filter === "all" || (filter === "qualified" ? r.qualifies : !r.qualifies);
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.student.firstName.toLowerCase().includes(q) ||
      r.student.lastName.toLowerCase().includes(q)  ||
      r.internship.title.toLowerCase().includes(q)  ||
      r.employer?.company.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const qualified    = allResults.filter(r =>  r.qualifies).length;
  const notQualified = allResults.filter(r => !r.qualifies).length;

  const copySummary = text => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="WIL Matching"
        sub="Automated qualification analysis — mock data active. Swap to real Supabase data when ready."
      />

      {/* Data source notices */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex-1 min-w-0">
          <span className="text-lg">🧪</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Mock students (WIL_Mock_Data_CSV)</p>
            <p className="text-xs text-amber-600">3 students — replace with live Supabase queries when ready.</p>
          </div>
        </div>
        <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 flex-1 min-w-0 border ${liveLoading ? "bg-gray-50 border-gray-200" : liveJobs.length ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"}`}>
          <span className="text-lg">{liveLoading ? "⏳" : liveJobs.length ? "🟢" : "⚪"}</span>
          <div>
            <p className={`text-sm font-semibold ${liveLoading ? "text-gray-600" : liveJobs.length ? "text-emerald-800" : "text-gray-600"}`}>
              {liveLoading ? "Loading live internships…" : liveJobs.length ? `${liveJobs.length} live internship${liveJobs.length!==1?"s":""} from registered employers` : "No live internships posted yet"}
            </p>
            <p className="text-xs text-gray-500">Posted by employers registered by admin.</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {!liveLoading && (
        <div className="grid grid-cols-4 gap-4">
          {[
            ["Evaluations", allResults.length,  "text-gray-800",    "border-gray-100"   ],
            ["Qualified",   qualified,           "text-green-600",   "border-green-100"  ],
            ["Not Qualified",notQualified,       "text-red-500",     "border-red-100"    ],
            ["Live Internships",liveJobs.length, "text-emerald-600", "border-emerald-100"],
          ].map(([label, val, color, border]) => (
            <div key={label} className={`bg-white rounded-2xl p-4 shadow-sm border ${border} text-center`}>
              <p className={`text-2xl font-bold ${color}`}>{val}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Ico.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search student, internship or company…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        {[["all","All"],["qualified","Qualified ✓"],["notqualified","Not Qualified ✗"]].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${filter===v ? "bg-slate-800 text-white border-slate-800" : "bg-white text-gray-600 border-gray-200 hover:border-slate-400"}`}>{l}</button>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-4">
        {shown.map((r, i) => (
          <div key={i} className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 ${r.qualifies ? "border-l-green-500 border border-green-100" : "border-l-red-400 border border-red-50"}`}>
            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${r.qualifies ? "bg-gradient-to-br from-green-400 to-emerald-600" : "bg-gradient-to-br from-red-400 to-red-600"}`}>
                  {r.student.firstName[0]}{r.student.lastName[0]}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{r.student.firstName} {r.student.lastName}</p>
                  <p className="text-xs text-gray-500">{r.student.id} · {r.student.email}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <p className="text-sm font-semibold text-gray-700">{r.internship.title}</p>
                  {r.internship.isLive && <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">● Live</span>}
                </div>
                <p className="text-xs text-gray-500">{r.employer?.company || r.internship.company} · {r.internship.location}</p>
              </div>
              <span className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full ${r.qualifies ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                {r.qualifies ? "✓ Qualifies" : "✗ Does Not Qualify"}
              </span>
            </div>

            {/* Criteria chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {r.criteria.map(c => (
                <span key={c.label} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${c.pass ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                  {c.pass ? <Ico.Check className="w-3 h-3"/> : <Ico.X className="w-3 h-3"/>} {c.label}: {c.detail}
                </span>
              ))}
              {r.skills.map(s => (
                <span key={s.skill} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                  🔧 {s.skill} ({s.level})
                </span>
              ))}
            </div>

            {/* Natural language summary */}
            <div className={`rounded-xl px-4 py-3 text-sm font-medium leading-relaxed flex items-start justify-between gap-3 ${r.qualifies ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
              <p>"{r.summary}"</p>
              <button onClick={() => copySummary(r.summary)} title="Copy summary" className="shrink-0 mt-0.5 text-gray-400 hover:text-gray-700 transition-colors">
                {copied === r.summary ? <Ico.Check className="w-4 h-4 text-green-600" /> : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth="2"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {shown.length === 0 && (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium">No results match your filter.</p>
        </div>
      )}
    </div>
  );
}
