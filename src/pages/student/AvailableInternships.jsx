/**
 * src/pages/student/AvailableInternships.jsx
 * Students browse and apply to employer-posted internships (CV upload only).
 */
import { useState, useEffect } from "react";
import { supabase }            from "../../lib/supabase";
import { Ico }                 from "../../components/icons/Icons";
import { Modal, Toast, Spinner, MatchBar, PageHeader } from "../../components/ui";
import { inputCls }            from "../../utils/constants";
import { skillMatch }          from "../../utils/matchingEngine";

export function AvailableInternships({ profile }) {
  const [internships,  setInternships]  = useState([]);
  const [appliedIds,   setAppliedIds]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [type,         setType]         = useState("All");
  const [detail,       setDetail]       = useState(null);
  const [applyTarget,  setApplyTarget]  = useState(null);
  const [cvFile,       setCvFile]       = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const [toast,        setToast]        = useState(null);

  const showToast = (message, t = "success") => { setToast({ message, type: t }); setTimeout(() => setToast(null), 3500); };

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

  const openApply  = internship => { setApplyTarget(internship); setCvFile(null); };
  const closeApply = () => { setApplyTarget(null); setCvFile(null); };

  const handleApply = async () => {
    if (!cvFile) { showToast("Please upload your CV to apply.", "error"); return; }
    if (cvFile.type !== "application/pdf") { showToast("Only PDF files are accepted.", "error"); return; }
    if (cvFile.size > 5 * 1024 * 1024) { showToast("CV must be under 5 MB.", "error"); return; }

    setUploading(true);
    try {
      const filePath = `${profile.id}/${applyTarget.id}_${Date.now()}.pdf`;
      const { error: upErr } = await supabase.storage.from("cvs").upload(filePath, cvFile, { upsert: true });
      if (upErr) throw new Error("CV upload failed: " + upErr.message);
      const { data: urlData } = await supabase.storage.from("cvs").createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10);
      const cvUrl = urlData?.signedUrl || null;

      const { error: appErr } = await supabase.from("applications").insert({
        student_id:    profile.id,
        internship_id: applyTarget.id,
        status:        "pending",
        applied_date:  new Date().toISOString().split("T")[0],
        cv_url:        cvUrl,
      });
      if (appErr) throw new Error(appErr.message);

      setAppliedIds(prev => [...prev, applyTarget.id]);
      showToast("Application submitted with your CV!");
      closeApply();
    } catch (err) {
      showToast(err.message, "error");
    }
    setUploading(false);
  };

  const filtered = internships.filter(i => {
    const q = search.toLowerCase();
    return (type === "All" || i.type === type) &&
      (!q || i.internship_name.toLowerCase().includes(q) || i.company_name.toLowerCase().includes(q) || (i.skills_required || []).some(s => s.toLowerCase().includes(q)));
  });

  if (loading) return <Spinner />;
  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}
      <PageHeader title="Available Internships" sub={`${internships.length} programmes open for applications`} />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, company or skill…"
          className={`flex-1 min-w-48 ${inputCls}`} />
        {["All", "Full-Time", "Part-Time"].map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${type === t ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(i => {
          const applied = appliedIds.includes(i.id);
          const req     = skillMatch(profile.skills || [], i.skills_required || []);
          return (
            <div key={i.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800">{i.internship_name}</h3>
                  <p className="text-indigo-600 font-medium text-sm">{i.company_name}</p>
                </div>
                <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${i.type === "Full-Time" ? "bg-indigo-100 text-indigo-700" : "bg-purple-100 text-purple-700"}`}>{i.type}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1"><Ico.MapPin />{i.location}</span>
                <span className="flex items-center gap-1"><Ico.Clock />{i.duration}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(i.skills_required || []).map(s => {
                  const have = (profile.skills || []).map(x => x.toLowerCase()).includes(s.toLowerCase());
                  return <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium ${have ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{s}</span>;
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
                  <button onClick={() => openApply(i)} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all">Apply</button>
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

      {/* Detail modal */}
      {detail && (
        <Modal onClose={() => setDetail(null)}>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{detail.internship_name}</h2>
                <p className="text-indigo-600 font-medium">{detail.company_name}</p>
              </div>
              <button onClick={() => setDetail(null)} className="p-2 hover:bg-gray-100 rounded-xl"><Ico.X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{detail.description}</p>
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              {[["Type", detail.type], ["Duration", detail.duration], ["Location", detail.location, "col-span-2"]].map(([k, v, cls = ""]) => (
                <div key={k} className={`bg-gray-50 rounded-xl p-3 ${cls}`}>
                  <p className="text-gray-400 text-xs">{k}</p><p className="font-semibold">{v}</p>
                </div>
              ))}
            </div>
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Skills Required</p>
              <div className="flex flex-wrap gap-2">
                {(detail.skills_required || []).map(s => {
                  const have = (profile.skills || []).map(x => x.toLowerCase()).includes(s.toLowerCase());
                  return (
                    <span key={s} className={`text-sm px-3 py-1 rounded-full font-medium flex items-center gap-1 ${have ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}>
                      {have ? <Ico.Check className="w-3 h-3" /> : <Ico.X className="w-3 h-3" />}{s}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 mb-5">
              <MatchBar percent={skillMatch(profile.skills || [], detail.skills_required || []).percent} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDetail(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Close</button>
              {appliedIds.includes(detail.id) ? (
                <button disabled className="flex-1 py-2.5 bg-gray-100 text-gray-400 rounded-xl text-sm">Applied ✓</button>
              ) : (
                <button onClick={() => { setDetail(null); openApply(detail); }} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">Apply Now</button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Apply modal — CV upload only */}
      {applyTarget && (
        <Modal onClose={closeApply}>
          <div className="p-6">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{applyTarget.internship_name}</h2>
                <p className="text-indigo-600 font-medium text-sm">{applyTarget.company_name}</p>
              </div>
              <button onClick={closeApply} className="p-2 hover:bg-gray-100 rounded-xl"><Ico.X className="w-4 h-4" /></button>
            </div>

            {/* Pre-filled profile */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Profile</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><p className="text-xs text-gray-400">Name</p><p className="font-medium text-gray-800">{profile.name}</p></div>
                <div><p className="text-xs text-gray-400">Email</p><p className="font-medium text-gray-800 truncate">{profile.email}</p></div>
                <div><p className="text-xs text-gray-400">Major</p><p className="font-medium text-gray-800">{profile.major || "—"}</p></div>
                <div><p className="text-xs text-gray-400">Year</p><p className="font-medium text-gray-800">{profile.year || "—"}</p></div>
                <div><p className="text-xs text-gray-400">Average Mark</p><p className="font-medium text-gray-800">{profile.average_mark != null ? `${profile.average_mark}%` : "—"}</p></div>
                <div>
                  <p className="text-xs text-gray-400">Skills Match</p>
                  <p className={`font-semibold ${skillMatch(profile.skills || [], applyTarget.skills_required || []).percent >= 70 ? "text-green-600" : "text-amber-600"}`}>
                    {skillMatch(profile.skills || [], applyTarget.skills_required || []).percent}%
                  </p>
                </div>
              </div>
            </div>

            {/* CV Upload */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Upload CV (PDF) <span className="text-red-500">*</span>
              </label>
              <div
                onClick={() => document.getElementById("cv-file-input").click()}
                className={`cursor-pointer border-2 border-dashed rounded-xl p-5 text-center transition-all ${cvFile ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"}`}>
                {cvFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-indigo-700">{cvFile.name}</p>
                      <p className="text-xs text-gray-500">{(cvFile.size / 1024).toFixed(0)} KB · PDF</p>
                    </div>
                    <button type="button" onClick={e => { e.stopPropagation(); setCvFile(null); }} className="ml-auto text-red-400 hover:text-red-600">
                      <Ico.X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-3xl mb-1">📤</p>
                    <p className="text-sm font-medium text-gray-600">Click to select your CV</p>
                    <p className="text-xs text-gray-400 mt-0.5">PDF only · Max 5 MB</p>
                  </>
                )}
              </div>
              <input id="cv-file-input" type="file" accept="application/pdf" className="hidden"
                onChange={e => setCvFile(e.target.files?.[0] || null)} />
            </div>

            <div className="flex gap-3">
              <button onClick={closeApply} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleApply} disabled={uploading}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {uploading
                  ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting…</>
                  : "Submit Application"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
