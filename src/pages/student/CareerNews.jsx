/**
 * src/pages/student/CareerNews.jsx
 * Latest SA career news: curated seed articles + live OpenAI feed.
 */
import { useState, useEffect } from "react";
import { Ico } from "../../components/icons/Icons";
import { Spinner, PageHeader } from "../../components/ui";
import {
  NEWS_CATEGORIES,
  CATEGORY_NEWS_COLORS,
  NEWS_SOURCES,
  SEED_ARTICLES,
} from "../../utils/constants";
import { openAIWebSearch, OPENAI_NEWS_PROMPT } from "../../services/ai";

export function CareerNews() {
  const [category,  setCategory]  = useState("All");
  const [search,    setSearch]    = useState("");
  const [articles,  setArticles]  = useState(SEED_ARTICLES);
  const [loading,   setLoading]   = useState(false);
  const [liveError, setLiveError] = useState("");
  const hasOpenAI = !!import.meta.env.VITE_OPENAI_API_KEY;

  useEffect(() => {
    if (!hasOpenAI) return;
    setLoading(true); setLiveError("");
    openAIWebSearch(OPENAI_NEWS_PROMPT)
      .then(results => {
        if (!results || results.length === 0) {
          setLiveError("No articles returned — showing curated articles instead.");
        } else {
          const normalised = results.map((a, i) => ({
            id:       a.id || `n${i}`,
            title:    a.title || "Untitled",
            source:   a.source || "SA Careers",
            category: ["Career Tips","Graduate","Learnerships","Tech","Finance","Engineering"].includes(a.category) ? a.category : "Career Tips",
            date:     a.date || new Date().toISOString().split("T")[0],
            readTime: a.readTime || "3 min",
            summary:  a.summary || "",
            url:      a.url || "https://www.careers24.com/news/",
          }));
          setArticles(normalised);
        }
      })
      .catch(err => setLiveError(err.message))
      .finally(() => setLoading(false));
  }, [hasOpenAI]);

  const filtered = articles.filter(a => {
    const matchCat    = category === "All" || a.category === category;
    const q           = search.toLowerCase();
    const matchSearch = !q || a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.source.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Career News" sub="Latest graduate opportunities, career tips and industry news for SA students." />

      {/* Live status bar */}
      {hasOpenAI && (
        <div className={`flex items-center gap-3 rounded-2xl px-5 py-3 border ${liveError ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"}`}>
          <div className={`w-2 h-2 rounded-full shrink-0 ${liveError ? "bg-amber-400" : loading ? "bg-indigo-400 animate-pulse" : "bg-emerald-500 animate-pulse"}`} />
          <p className={`text-sm font-medium flex-1 ${liveError ? "text-amber-800" : "text-emerald-800"}`}>
            {loading ? "Fetching latest SA career news via OpenAI…" : liveError ? `⚠ ${liveError}` : `Live articles · ${articles.length} loaded`}
          </p>
        </div>
      )}

      {/* News source quick-links */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Browse SA Career News Sources</p>
        <div className="flex flex-wrap gap-2">
          {NEWS_SOURCES.map(s => (
            <a key={s.name} href={s.url} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 border border-gray-100 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group text-sm">
              <span>{s.logo}</span>
              <span className="font-medium text-gray-700 group-hover:text-indigo-700">{s.name}</span>
              <Ico.ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-indigo-400" />
            </a>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Ico.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search news…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <div className="flex flex-wrap gap-2">
          {NEWS_CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${category === c ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading && <Spinner />}
      {!loading && <p className="text-sm text-gray-500">{filtered.length} article{filtered.length !== 1 ? "s" : ""}</p>}

      {/* Featured article */}
      {filtered.length > 0 && category === "All" && !search && (
        <a href={filtered[0].url} target="_blank" rel="noreferrer"
          className="block bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-2xl p-6 text-white hover:opacity-95 transition-all shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20">{filtered[0].category}</span>
            <span className="text-white/60 text-xs">{filtered[0].source} · {filtered[0].date} · {filtered[0].readTime} read</span>
          </div>
          <h2 className="text-xl font-bold leading-snug mb-2">{filtered[0].title}</h2>
          <p className="text-white/75 text-sm leading-relaxed">{filtered[0].summary}</p>
          <p className="mt-4 text-xs font-semibold text-white/60 flex items-center gap-1">
            Read full article <Ico.ExternalLink className="w-3 h-3" />
          </p>
        </a>
      )}

      {/* Article grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {(category === "All" && !search ? filtered.slice(1) : filtered).map(a => {
          const cat = CATEGORY_NEWS_COLORS[a.category] || { bg: "bg-gray-100", text: "text-gray-700" };
          return (
            <a key={a.id} href={a.url} target="_blank" rel="noreferrer"
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col gap-3 group">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cat.bg} ${cat.text}`}>{a.category}</span>
                <span className="text-xs text-gray-400">{a.readTime} read</span>
              </div>
              <h3 className="font-bold text-gray-800 text-sm leading-snug group-hover:text-indigo-700 transition-colors">{a.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed flex-1">{a.summary}</p>
              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <span className="text-xs text-gray-400">{a.source} · {a.date}</span>
                <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                  Read more <Ico.ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </a>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl">
          <p className="text-4xl mb-3">📰</p>
          <p className="font-medium">No articles match your search.</p>
        </div>
      )}
    </div>
  );
}
