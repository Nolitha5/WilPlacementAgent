/**
 * src/pages/student/StudentDashboard.jsx
 */
import { useState, useEffect } from "react";
import { supabase }            from "../../lib/supabase";
import { Badge, StatCard, PageHeader, Spinner } from "../../components/ui";

export function StudentDashboard({ profile }) {
  const [stats,   setStats]   = useState({});
  const [recent,  setRecent]  = useState([]);
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
      <PageHeader title={`Welcome, ${(profile.name || "").split(" ")[0]} 👋`} sub="Track your WIL placements and discover internship opportunities." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Applied"    value={stats.total}     gradient="from-indigo-500 to-indigo-700" />
        <StatCard label="Pending"    value={stats.pending}   gradient="from-amber-400 to-orange-500"  />
        <StatCard label="Interviews" value={stats.interview} gradient="from-blue-500 to-blue-700"     />
        <StatCard label="Declined"   value={stats.declined}  gradient="from-red-400 to-rose-600"      />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">My Profile</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Major</span><span className="font-medium">{profile.major || "—"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Year</span><span className="font-medium">{profile.year || "—"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Average Mark</span><span className="font-medium">{profile.average_mark != null ? `${profile.average_mark}%` : "—"}</span></div>
            <div className="pt-2">
              <p className="text-gray-500 mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {(profile.skills || []).map(s => (
                  <span key={s} className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-medium">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">Recent Applications</h2>
          {recent.length === 0 ? (
            <p className="text-gray-400 text-sm">No applications yet.</p>
          ) : (
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
