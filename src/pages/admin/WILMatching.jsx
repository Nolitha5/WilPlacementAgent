/**
 * src/pages/admin/WILMatching.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Matches real Supabase students against real employer-posted internships.
 * No mock data — all records come from the database.
 *
 * Students query:  students JOIN profiles (name, email)
 * Internships query: internships JOIN employers (company)
 */
import { useState, useEffect, useCallback } from "react";
import { supabase }    from "../../lib/supabase";
import { Ico }         from "../../components/icons/Icons";
import { Spinner, PageHeader } from "../../components/ui";
import { runLiveMatching }     from "../../utils/matchingEngine";

export function WILMatching() {
  const [students,     setStudents]     = useState([]);
  const [internships,  setInternships]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState("all");
  const [search,       setSearch]       = useState("");
  const [copied,       setCopied]       = useState(null);

  // ── Fetch both tables in parallel ──────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: studs }, { data: jobs }] = await Promise.all([
      supabase
        .from("students")
        .select("*, profiles(name, email)")
        .order("created_at", { ascending: false }),
      supabase
        .from("internships")
        .select("*, employers(company)")
        .order("created_at", { ascending: false }),
    ]);
    setStudents(studs   || []);
    setInternships(jobs || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Run matching on fetched data ───────────────────────────────────────────
  const allResults = loading ? [] : runLiveMatching(students, internships);

  const qualified    = allResults.filter(r =>  r.qualifies).length;
  const notQualified = allResults.filter(r => !r.qualifies).length;

  const shown = allResults.filter(r => {
    const matchFilter  = filter === "all" || (filter === "qualified" ? r.qualifies : !r.qualifies);
    const q            = search.toLowerCase();
    const matchSearch  =
      !q ||
      r.student.firstName.toLowerCase().includes(q) ||
      r.student.lastName.toLowerCase().includes(q)  ||
      r.internship.title.toLowerCase().includes(q)  ||
      r.employer.company.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const copySummary = text => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="WIL Matching"
        sub="Live match results — real students from the database against employer-posted internships."
      />

      {/* Data source status cards */}
      <div className="flex flex-wrap gap-3">
        <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 flex-1 min-w-0 border ${students.length ? "bg-indigo-50 border-indigo-200" : "bg-gray-50 border-gray-200"}`}>
          <span className="text-lg">{students.length ? "🎓" : "⚪"}</span>
          <div>
            <p className={`text-sm font-semibold ${students.length ? "text-indigo-800" : "text-gray-600"}`}>
              {students.length} registered student{students.length !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-gray-500">From the students table in Supabase.</p>
          </div>
          <button onClick={loadData} title="Refresh" className="ml-auto text-gray-400 hover:text-indigo-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 flex-1 min-w-0 border ${internships.length ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"}`}>
          <span className="text-lg">{internships.length ? "🏢" : "⚪"}</span>
          <div>
            <p className={`text-sm font-semibold ${internships.length ? "text-emerald-800" : "text-gray-600"}`}>
              {internships.length} internship{internships.length !== 1 ? "s" : ""} posted by employers
            </p>
            <p className="text-xs text-gray-500">Posted by registered employers.</p>
          </div>
        </div>
      </div>

      {/* Empty state — no data yet */}
      {students.length === 0 || internships.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-400">
          <p className="text-4xl mb-3">{students.length === 0 ? "🎓" : "🏢"}</p>
          <p className="font-semibold text-gray-600 mb-1">
            {students.length === 0
              ? "No students registered yet."
              : "No internships posted yet."}
          </p>
          <p className="text-sm">
            {students.length === 0
              ? "Students need to register before matching can run."
              : "Ask employers to post internships so matching can run."}
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["Evaluations",    allResults.length,  "text-gray-800",    "border-gray-100"    ],
              ["Qualified",      qualified,           "text-green-600",   "border-green-100"   ],
              ["Not Qualified",  notQualified,        "text-red-500",     "border-red-100"     ],
              ["Internships",    internships.length,  "text-emerald-600", "border-emerald-100" ],
            ].map(([label, val, color, border]) => (
              <div key={label} className={`bg-white rounded-2xl p-4 shadow-sm border ${border} text-center`}>
                <p className={`text-2xl font-bold ${color}`}>{val}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Ico.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search student, internship or company…"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            {[["all","All"],["qualified","Qualified ✓"],["notqualified","Not Qualified ✗"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${filter === v ? "bg-slate-800 text-white border-slate-800" : "bg-white text-gray-600 border-gray-200 hover:border-slate-400"}`}>
                {l}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="space-y-4">
            {shown.map((r, i) => (
              <div key={i} className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 ${r.qualifies ? "border-l-green-500 border border-green-100" : "border-l-red-400 border border-red-50"}`}>

                {/* Student + internship header */}
                <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                  {/* Student avatar + info */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${r.qualifies ? "bg-gradient-to-br from-green-400 to-emerald-600" : "bg-gradient-to-br from-red-400 to-red-600"}`}>
                      {r.student.firstName[0]}{r.student.lastName[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{r.student.firstName} {r.student.lastName}</p>
                      <p className="text-xs text-gray-500">{r.student.major} · {r.student.year} · {r.student.email}</p>
                    </div>
                  </div>

                  {/* Internship info */}
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-700">{r.internship.title}</p>
                    <p className="text-xs text-gray-500">{r.employer.company} · {r.internship.location}</p>
                    {r.internship.duration && <p className="text-xs text-gray-400">{r.internship.duration}</p>}
                  </div>

                  {/* Match badge */}
                  <span className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full ${r.qualifies ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {r.qualifies ? `✓ ${r.scorePercent}% Match` : `✗ ${r.scorePercent}% Match`}
                  </span>
                </div>

                {/* Criteria chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {r.criteria.map(c => (
                    <span key={c.label} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border ${c.pass ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                      {c.pass ? <Ico.Check className="w-3 h-3" /> : <Ico.X className="w-3 h-3" />}
                      {c.label}: {c.detail}
                    </span>
                  ))}
                </div>

                {/* Skills chips — green = matched, red = missing */}
                {r.internship.skillsRequired.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {r.internship.skillsRequired.map(s => {
                      const have = r.matchedSkills.map(m => m.toLowerCase()).includes(s.toLowerCase());
                      return (
                        <span key={s} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${have ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}>
                          {have ? <Ico.Check className="w-3 h-3" /> : <Ico.X className="w-3 h-3" />} {s}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Student's own skills (not required but useful context) */}
                {r.student.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {r.student.skills.map(s => (
                      <span key={s} className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full">
                        🔧 {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Professional AI summary */}
                <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed flex items-start justify-between gap-3 ${r.qualifies ? "bg-green-50 text-green-900" : "bg-red-50 text-red-900"}`}>
                  <p>{r.summary}</p>
                  <button onClick={() => copySummary(r.summary)} title="Copy summary"
                    className="shrink-0 mt-0.5 text-gray-400 hover:text-gray-700 transition-colors">
                    {copied === r.summary
                      ? <Ico.Check className="w-4 h-4 text-green-600" />
                      : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth="2"/>
                        </svg>
                      )
                    }
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
        </>
      )}
    </div>
  );
}
