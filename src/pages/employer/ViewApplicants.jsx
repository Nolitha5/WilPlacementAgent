/**
 * src/pages/employer/ViewApplicants.jsx
 * Employer reviews applicants, scans CVs, and schedules interviews.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Ico }      from "../../components/icons/Icons";
import { Badge, Modal, Toast, Spinner, MatchBar, PageHeader } from "../../components/ui";
import { inputCls } from "../../utils/constants";
import { skillMatch } from "../../utils/matchingEngine";

export function ViewApplicants({ profile }) {
  const [listings, setListings] = useState([]);
  const [apps,     setApps]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filterL,  setFilterL]  = useState("all");
  const [filterS,  setFilterS]  = useState("all");
  const [selected, setSelected] = useState(null);
  const [iDate,    setIDate]    = useState("");
  const [note,     setNote]     = useState("");
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);

  const showToast = (message, t = "success") => { setToast({ message, type: t }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const { data: myListings } = await supabase.from("internships").select("*").eq("employer_id", profile.id);
    setListings(myListings || []);
    const ids = (myListings || []).map(i => i.id);
    if (ids.length) {
      const { data: myApps } = await supabase
        .from("applications")
        .select("*, cv_url, motivation, internships(internship_name, skills_required), students(major, year, average_mark, skills, profiles(name, email))")
        .in("internship_id", ids)
        .order("created_at", { ascending: false });
      setApps(myApps || []);
    }
    setLoading(false);
  }, [profile.id]);

  useEffect(() => { load(); }, [load]);

  const handleRespond = async (id, status) => {
    setSaving(true);
    await supabase.from("applications").update({
      status,
      interview_date: status === "interview" ? iDate : null,
      note,
    }).eq("id", id);
    setSelected(null); setIDate(""); setNote("");
    showToast(status === "interview" ? "Interview scheduled!" : "Application declined.");
    load(); setSaving(false);
  };

  const shown = apps.filter(a =>
    (filterL === "all" || a.internship_id === filterL) &&
    (filterS === "all" || a.status === filterS)
  );

  if (loading) return <Spinner />;
  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}
      <PageHeader title="View Applicants" sub={`${apps.length} application${apps.length !== 1 ? "s" : ""} across your listings`} />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterL} onChange={e => setFilterL(e.target.value)} className={`${inputCls} w-auto`}>
          <option value="all">All Listings</option>
          {listings.map(i => <option key={i.id} value={i.id}>{i.internship_name}</option>)}
        </select>
        {[["all","All"],["pending","Pending"],["interview","Interview"],["declined","Declined"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilterS(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterS === v ? "bg-emerald-700 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-emerald-300"}`}>{l}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl">
          <Ico.Users className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No applicants found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shown.map(a => {
            const student  = a.students || {};
            const sProfile = student.profiles || {};
            const req      = skillMatch(student.skills || [], a.internships?.skills_required || []);
            return (
              <div key={a.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-blue-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {(sProfile.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
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
                  {(student.skills || []).map(s => {
                    const match = (a.internships?.skills_required || []).map(r => r.toLowerCase()).includes(s.toLowerCase());
                    return <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium ${match ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{s}</span>;
                  })}
                </div>

                {/* Requirements scan */}
                <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-600">Requirements Scan</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${req.percent >= 70 ? "bg-green-100 text-green-700" : req.percent >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>
                      {req.percent >= 70 ? "✓ Good Match" : req.percent >= 40 ? "⚠ Partial Match" : "✗ Low Match"}
                    </span>
                  </div>
                  <MatchBar percent={req.percent} />
                  {req.percent < 100 && (a.internships?.skills_required || []).filter(r => !(student.skills || []).map(s => s.toLowerCase()).includes(r.toLowerCase())).length > 0 && (
                    <p className="text-xs text-red-500">
                      Missing skills: {(a.internships?.skills_required || []).filter(r => !(student.skills || []).map(s => s.toLowerCase()).includes(r.toLowerCase())).join(", ")}
                    </p>
                  )}
                </div>

                {/* Motivation (shown if present) */}
                {a.motivation && (
                  <div className="mb-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Motivation</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{a.motivation}</p>
                  </div>
                )}

                {/* CV download */}
                {a.cv_url ? (
                  <a href={a.cv_url} target="_blank" rel="noreferrer"
                    className="mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 bg-emerald-50 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-all">
                    <span>📄</span> Download CV <Ico.ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <div className="mb-3 flex items-center gap-2 px-4 py-2.5 border border-gray-100 bg-gray-50 rounded-xl text-sm text-gray-400 w-full">
                    <span className="text-lg">📄</span> No CV uploaded
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    Applied: {a.applied_date}
                    {a.interview_date && <span className="ml-2 text-blue-600 font-semibold">📅 {a.interview_date}</span>}
                    {a.note && <span className="ml-2 italic">· {a.note}</span>}
                  </div>
                  {a.status === "pending" && (
                    <button onClick={() => setSelected(a)} className="px-4 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-600 transition-all">Respond</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Respond modal */}
      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <div className="p-6">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Respond to Application</h2>
                <p className="text-sm text-gray-500">{selected.students?.profiles?.name} · {selected.internships?.internship_name}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-xl"><Ico.X className="w-4 h-4" /></button>
            </div>
            {(() => {
              const r = skillMatch(selected.students?.skills || [], selected.internships?.skills_required || []);
              return (
                <div className={`rounded-xl p-4 mb-4 ${r.percent >= 70 ? "bg-green-50" : "bg-amber-50"}`}>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Match: {r.percent}%</p>
                  <p className="text-xs text-gray-500">Student has {r.matched.length} of {r.total} required skills.</p>
                </div>
              );
            })()}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Interview Date <span className="font-normal text-gray-400">(required to schedule)</span>
                </label>
                <input type="date" value={iDate} onChange={e => setIDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Note to Student <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                  placeholder="e.g. Interview via Zoom, bring portfolio." className={`${inputCls} resize-none`} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setSelected(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleRespond(selected.id, "declined")} disabled={saving}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5">
                <Ico.X className="w-4 h-4" /> Decline
              </button>
              <button onClick={() => handleRespond(selected.id, "interview")} disabled={!iDate || saving}
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
