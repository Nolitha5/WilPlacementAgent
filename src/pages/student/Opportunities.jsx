/**
 * src/pages/student/Opportunities.jsx
 * Real SA jobs: curated listings + live OpenAI-powered feed.
 */
import { useState, useEffect, useCallback } from "react";
import { Ico } from "../../components/icons/Icons";
import { Spinner, PageHeader } from "../../components/ui";
import {
  CATEGORIES,
  CATEGORY_COLORS,
  CURATED_SA,
  JOB_BOARDS,
} from "../../utils/constants";
import { openAIWebSearch, OPENAI_JOB_PROMPT } from "../../services/ai";

export function Opportunities() {
  const [category,    setCategory]   = useState("All");
  const [search,      setSearch]     = useState("");
  const [liveJobs,    setLiveJobs]   = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError,   setLiveError]  = useState("");
  const hasOpenAI = !!import.meta.env.VITE_OPENAI_API_KEY;

  const fetchLiveJobs = useCallback(async () => {
    setLiveLoading(true); setLiveError(""); setLiveJobs([]);
    try {
      const results = await openAIWebSearch(OPENAI_JOB_PROMPT);
      if (!results || results.length === 0) {
        setLiveError("No results returned. Check your OpenAI API key.");
      } else {
        const normalised = results.map((j, i) => ({
          id:          j.id || `ai_${i}`,
          title:       j.title || "Untitled",
          company:     j.company || "Unknown",
          location:    j.location || "South Africa",
          type:        ["Internship","WIL","Graduate","Junior","Entry Level"].includes(j.type) ? j.type : "Entry Level",
          duration:    j.duration || "Not specified",
          url:         j.url || "#",
          description: j.description || "",
          logo:        "🌐",
          live:        true,
        }));
        setLiveJobs(normalised);
      }
    } catch (err) {
      setLiveError(err.message);
    }
    setLiveLoading(false);
  }, []);

  useEffect(() => { if (hasOpenAI) fetchLiveJobs(); }, [hasOpenAI, fetchLiveJobs]);

  const allJobs = [...CURATED_SA, ...liveJobs];
  const filtered = allJobs.filter(j => {
    const matchCat    = category === "All" || j.type === category;
    const q           = search.toLowerCase();
    const matchSearch = !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || (j.location || "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Opportunities"
        sub="Real South African internships, WIL placements, graduate programmes and entry-level jobs."
      />

      {/* SA job boards */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-3">🔗 Browse live listings on SA job boards</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {JOB_BOARDS.map(b => (
            <a key={b.name} href={b.url} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2.5 border border-gray-100 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
              <span className="text-lg">{b.logo}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 group-hover:text-indigo-700 truncate">{b.name}</p>
                <p className="text-xs text-gray-400 truncate">{b.desc}</p>
              </div>
              <Ico.ExternalLink className="ml-auto shrink-0 text-gray-300 group-hover:text-indigo-400 w-3 h-3" />
            </a>
          ))}
        </div>
      </div>

      {/* Live feed status */}
      {hasOpenAI ? (
        <div className={`flex items-center gap-3 rounded-2xl px-5 py-3 border ${liveError ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"}`}>
          <div className={`w-2 h-2 rounded-full shrink-0 ${liveError ? "bg-amber-400" : liveLoading ? "bg-indigo-400 animate-pulse" : "bg-emerald-500 animate-pulse"}`} />
          <p className={`text-sm font-medium flex-1 ${liveError ? "text-amber-800" : "text-emerald-800"}`}>
            {liveLoading ? "Searching for live SA opportunities via OpenAI…" : liveError ? `⚠ ${liveError}` : `Live feed active · ${liveJobs.length} live + ${CURATED_SA.length} curated`}
          </p>
          {!liveLoading && (
            <button onClick={fetchLiveJobs} className="text-xs text-gray-400 hover:text-indigo-600">↺ Refresh</button>
          )}
        </div>
      ) : (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 text-sm text-indigo-700">
          <span className="font-semibold">Add your OpenAI API key</span> to <code className="bg-white px-1.5 py-0.5 rounded text-xs">.env</code> as <code className="bg-white px-1.5 py-0.5 rounded text-xs">VITE_OPENAI_API_KEY</code> to enable live job search. Showing curated listings below.
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Ico.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, company or location…"
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

      <p className="text-sm text-gray-500">{filtered.length} opportunit{filtered.length === 1 ? "y" : "ies"} found</p>

      {/* Job cards */}
      {liveLoading && liveJobs.length === 0 ? <Spinner /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(job => {
            const cat = CATEGORY_COLORS[job.type] || { bg: "bg-gray-100", text: "text-gray-700" };
            return (
              <div key={job.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl shrink-0">{job.logo || "💼"}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm leading-snug">{job.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{job.company}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${cat.bg} ${cat.text}`}>{job.type}</span>
                </div>
                {job.description && <p className="text-xs text-gray-500 leading-relaxed">{job.description}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Ico.MapPin />{job.location}</span>
                  <span className="flex items-center gap-1"><Ico.Clock />{job.duration}</span>
                  {job.live && <span className="text-emerald-600 font-medium">● Live</span>}
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
