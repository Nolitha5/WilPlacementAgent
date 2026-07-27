/**
 * src/pages/student/MyApplications.jsx
 * Shows submitted applications + "Opportunities You Qualify For" section.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase }   from "../../lib/supabase";
import { Ico }        from "../../components/icons/Icons";
import { Badge, Toast, Spinner, MatchBar, PageHeader, ConfirmModal } from "../../components/ui";

export function MyApplications({ profile, onNavigate }) {
  const [apps,            setApps]            = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [filter,          setFilter]          = useState("all");
  const [confirmDel,      setConfirmDel]      = useState(null);
  const [toast,           setToast]           = useState(null);
  const [liveInternships, setLiveInternships] = useState([]);
  const [matchLoading,    setMatchLoading]    = useState(true);

  const showToast = (message, t = "success") => { setToast({ message, type: t }); setTimeout(() => setToast(null), 3000); };

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

  // Fetch live internships posted by registered employers
  useEffect(() => {
    supabase
      .from("internships")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setLiveInternships(data || []); setMatchLoading(false); });
  }, []);

  const handleDelete = async id => {
    await supabase.from("applications").delete().eq("id", id);
    setConfirmDel(null);
    showToast("Application withdrawn.");
    load();
  };

  // Build qualified matches for this student (exclude already applied)
  const studentSkills = (profile.skills || []).map(s => s.toLowerCase());
  const appliedIds    = apps.map(a => a.internship_id);

  const qualifiedMatches = liveInternships
    .filter(i => !appliedIds.includes(i.id))
    .map(i => {
      const required  = (i.skills_required || []).map(s => s.toLowerCase());
      const matched   = required.filter(r => studentSkills.includes(r));
      const missing   = required.filter(r => !studentSkills.includes(r));
      const skillPct  = required.length ? Math.round((matched.length / required.length) * 100) : 100;
      const qualifies = skillPct >= 50;

      const reasons = [];
      if (matched.length)  reasons.push(matched.join(", "));
      if (profile.average_mark) reasons.push(`${profile.average_mark}% average`);
      if (["3rd Year", "4th Year", "Postgraduate"].includes(profile.year)) reasons.push("final-year status");

      const summary = qualifies
        ? `You qualify for ${i.internship_name} at ${i.company_name} in ${i.location}${reasons.length ? ` based on ${reasons.join(", ")}` : ""}.`
        : null;

      return { internship: i, skillPct, matched, missing, qualifies, summary };
    })
    .filter(m => m.qualifies)
    .sort((a, b) => b.skillPct - a.skillPct);

  const shown = filter === "all" ? apps : apps.filter(a => a.status === filter);

  if (loading) return <Spinner />;
  return (
    <div className="space-y-8">
      {toast && <Toast {...toast} />}

      {/* ── My Applications ── */}
      <div className="space-y-4">
        <PageHeader title="My Applications" sub={`${apps.length} application${apps.length !== 1 ? "s" : ""} submitted`} />
        <div className="flex gap-2 flex-wrap">
          {[["all","All"],["pending","Pending"],["interview","Interview Scheduled"],["declined","Declined"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === v ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"}`}>{l}</button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl">
            <Ico.List className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No applications found.</p>
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

      {/* ── Opportunities You Qualify For ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Opportunities You Qualify For</h2>
            <p className="text-sm text-gray-500">Based on your skills, average mark and year of study.</p>
          </div>
          {!matchLoading && (
            <span className="ml-auto text-xs font-semibold bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full">
              {qualifiedMatches.length} match{qualifiedMatches.length !== 1 ? "es" : ""}
            </span>
          )}
        </div>

        {matchLoading ? <Spinner /> : qualifiedMatches.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <p className="text-3xl mb-2">🔍</p>
            <p className="font-medium text-sm">No new matches right now.</p>
            <p className="text-xs mt-1">Employers post new internships regularly — check back soon.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {qualifiedMatches.map(({ internship: i, skillPct, missing, summary }) => (
              <div key={i.id} className="bg-white rounded-2xl p-5 shadow-sm border border-green-100 border-l-4 border-l-green-500">
                <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                  <div>
                    <h3 className="font-semibold text-gray-800">{i.internship_name}</h3>
                    <p className="text-indigo-600 text-sm font-medium">{i.company_name}</p>
                  </div>
                  <span className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-green-100 text-green-700">✓ Qualifies</span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><Ico.MapPin />{i.location}</span>
                  <span className="flex items-center gap-1"><Ico.Clock />{i.duration}</span>
                  <span className="flex items-center gap-1"><Ico.Tag />{i.type}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(i.skills_required || []).map(s => {
                    const have = studentSkills.includes(s.toLowerCase());
                    return (
                      <span key={s} className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${have ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}>
                        {have ? <Ico.Check className="w-3 h-3" /> : <Ico.X className="w-3 h-3" />}{s}
                      </span>
                    );
                  })}
                </div>
                <div className="mb-3"><MatchBar percent={skillPct} /></div>
                <div className="bg-green-50 rounded-xl px-4 py-2.5 text-xs text-green-800 font-medium mb-3 leading-relaxed">"{summary}"</div>
                {missing.length > 0 && (
                  <p className="text-xs text-amber-600 mb-3">⚠ Skills you're missing: {missing.join(", ")}</p>
                )}
                <button onClick={() => onNavigate("internships")}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
                  Apply Now →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDel && (
        <ConfirmModal message="Withdraw this application?" sub="You can re-apply later."
          onConfirm={() => handleDelete(confirmDel)} onCancel={() => setConfirmDel(null)} confirmLabel="Withdraw" />
      )}
    </div>
  );
}
