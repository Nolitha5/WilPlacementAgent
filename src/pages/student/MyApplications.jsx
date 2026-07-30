/**
 * src/pages/student/MyApplications.jsx
 * Shows submitted applications + "Opportunities You Qualify For".
 *
 * The matching section uses the same runLiveMatching engine as the admin
 * WIL Matching panel, so students see identical professional summaries,
 * criteria chips, skills chips and score percentages — just scoped to them.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase }  from "../../lib/supabase";
import { Ico }       from "../../components/icons/Icons";
import { Badge, Toast, Spinner, MatchBar, PageHeader, ConfirmModal } from "../../components/ui";
import { runLiveMatching } from "../../utils/matchingEngine";

export function MyApplications({ profile, onNavigate }) {
  const [apps,            setApps]            = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [filter,          setFilter]          = useState("all");
  const [confirmDel,      setConfirmDel]      = useState(null);
  const [toast,           setToast]           = useState(null);
  const [liveInternships, setLiveInternships] = useState([]);
  const [matchLoading,    setMatchLoading]    = useState(true);

  const showToast = (msg, t = "success") => { setToast({ message: msg, type: t }); setTimeout(() => setToast(null), 3000); };

  // ── Fetch submitted applications ───────────────────────────────────────────
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

  // ── Fetch all live internships for matching ────────────────────────────────
  useEffect(() => {
    supabase
      .from("internships")
      .select("*, employers(company)")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setLiveInternships(data || []); setMatchLoading(false); });
  }, []);

  const handleDelete = async id => {
    await supabase.from("applications").delete().eq("id", id);
    setConfirmDel(null);
    showToast("Application withdrawn.");
    load();
  };

  // ── Build matches using the same engine as the admin WIL Matching panel ───
  // Shape the logged-in profile to match what runLiveMatching expects:
  //   { id, major, year, average_mark, skills[], location, profiles: { name, email } }
  const appliedIds = apps.map(a => a.internship_id);

  const studentRow = {
    id:           profile.id,
    major:        profile.major        || "",
    year:         profile.year         || "",
    average_mark: profile.average_mark ?? 0,
    skills:       profile.skills       || [],
    location:     profile.location     || "",
    faculty:      profile.faculty      || "",
    profiles: {
      name:  profile.name  || "",
      email: profile.email || "",
    },
  };

  // Only run matching against internships not yet applied to
  const unapplied = liveInternships.filter(i => !appliedIds.includes(i.id));

  const qualifiedMatches = matchLoading
    ? []
    : runLiveMatching([studentRow], unapplied).filter(r => r.qualifies);

  const shown = filter === "all" ? apps : apps.filter(a => a.status === filter);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8">
      {toast && <Toast {...toast} />}

      {/* ── My Applications ─────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <PageHeader
          title="My Applications"
          sub={`${apps.length} application${apps.length !== 1 ? "s" : ""} submitted`}
        />

        {/* Status filters */}
        <div className="flex gap-2 flex-wrap">
          {[["all","All"],["pending","Pending"],["interview","Interview Scheduled"],["declined","Declined"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === v ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"}`}>
              {l}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl">
            <Ico.List className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No applications found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shown.map(a => (
              <div key={a.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">{a.internships?.internship_name}</h3>
                    <p className="text-indigo-600 text-sm font-medium">{a.internships?.company_name}</p>
                  </div>
                  <Badge status={a.status} />
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-2">
                  <span className="flex items-center gap-1"><Ico.MapPin />{a.internships?.location}</span>
                  <span className="flex items-center gap-1"><Ico.Clock />{a.internships?.duration}</span>
                  <span className="flex items-center gap-1"><Ico.Tag />{a.internships?.type}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(a.internships?.skills_required || []).map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{s}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex flex-col gap-0.5">
                    <span>Applied: {a.applied_date}</span>
                    {a.status === "interview" && a.interview_date && (
                      <span className="text-blue-600 font-semibold">📅 Interview: {a.interview_date}</span>
                    )}
                    {a.note && <span className="italic">"{a.note}"</span>}
                  </div>
                  {a.status === "pending" && (
                    <button onClick={() => setConfirmDel(a.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-xl border border-red-100 text-xs font-medium transition-all">
                      <Ico.Trash className="w-3.5 h-3.5" /> Withdraw
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Opportunities You Qualify For ────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Section header */}
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Opportunities You Qualify For</h2>
            <p className="text-sm text-gray-500">
              Matched against live internships based on your skills, location and academic average.
            </p>
          </div>
          {!matchLoading && (
            <span className="ml-auto shrink-0 text-xs font-semibold bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full">
              {qualifiedMatches.length} match{qualifiedMatches.length !== 1 ? "es" : ""}
            </span>
          )}
        </div>

        {/* Loading */}
        {matchLoading && <Spinner />}

        {/* Empty state */}
        {!matchLoading && qualifiedMatches.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-3xl mb-2">🔍</p>
            <p className="font-medium text-sm text-gray-600">No qualifying matches right now.</p>
            <p className="text-xs mt-1 text-gray-400">
              Employers post new internships regularly — check back soon.
            </p>
          </div>
        )}

        {/* Match cards — same layout as admin WIL Matching */}
        {!matchLoading && qualifiedMatches.length > 0 && (
          <div className="space-y-4">
            {qualifiedMatches.map((r, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-green-100 border-l-4 border-l-green-500">

                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                  <div>
                    <h3 className="font-semibold text-gray-800">{r.internship.title}</h3>
                    <p className="text-indigo-600 text-sm font-medium">{r.employer.company}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><Ico.MapPin />{r.internship.location}</span>
                      {r.internship.duration && <span className="flex items-center gap-1"><Ico.Clock />{r.internship.duration}</span>}
                      {r.internship.type    && <span className="flex items-center gap-1"><Ico.Tag />{r.internship.type}</span>}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                    ✓ {r.scorePercent}% Match
                  </span>
                </div>

                {/* Criteria chips (Skills / Location / Average) */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {r.criteria.map(c => (
                    <span key={c.label}
                      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border ${c.pass ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                      {c.pass ? <Ico.Check className="w-3 h-3" /> : <Ico.X className="w-3 h-3" />}
                      {c.label}: {c.detail}
                    </span>
                  ))}
                </div>

                {/* Required skills — green if you have it, red if missing */}
                {r.internship.skillsRequired.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {r.internship.skillsRequired.map(s => {
                      const have = r.matchedSkills.map(m => m.toLowerCase()).includes(s.toLowerCase());
                      return (
                        <span key={s}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${have ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}>
                          {have ? <Ico.Check className="w-3 h-3" /> : <Ico.X className="w-3 h-3" />} {s}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Skill match bar */}
                <div className="mb-3">
                  <MatchBar percent={r.skillPct} />
                </div>

                {/* Professional summary (same text the admin sees) */}
                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-900 leading-relaxed mb-3">
                  {r.summary}
                </div>

                {/* Missing skills nudge */}
                {r.missingSkills.length > 0 && (
                  <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-3">
                    <span className="shrink-0">⚠</span>
                    <span>Skills to develop: <span className="font-semibold">{r.missingSkills.join(", ")}</span></span>
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={() => onNavigate("internships")}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
                  Apply Now →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDel && (
        <ConfirmModal
          message="Withdraw this application?"
          sub="You can re-apply later."
          onConfirm={() => handleDelete(confirmDel)}
          onCancel={() => setConfirmDel(null)}
          confirmLabel="Withdraw"
        />
      )}
    </div>
  );
}
