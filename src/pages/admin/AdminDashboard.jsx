/**
 * src/pages/admin/AdminDashboard.jsx
 */
import { useState, useEffect } from "react";
import { supabase }            from "../../lib/supabase";
import { Spinner, StatCard, PageHeader } from "../../components/ui";

export function AdminDashboard() {
  const [stats,   setStats]   = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("employers").select("id",    { count:"exact", head:true }),
      supabase.from("internships").select("id",  { count:"exact", head:true }),
      supabase.from("applications").select("id", { count:"exact", head:true }),
      supabase.from("students").select("id",     { count:"exact", head:true }),
    ]).then(([e, i, a, s]) => {
      setStats({ employers: e.count, internships: i.count, applications: a.count, students: s.count });
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;
  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" sub="System overview — manage employers and monitor WIL activity." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Employers"    value={stats.employers}    gradient="from-slate-600 to-slate-800"     />
        <StatCard label="Students"     value={stats.students}     gradient="from-indigo-500 to-indigo-700"   />
        <StatCard label="Internships"  value={stats.internships}  gradient="from-emerald-500 to-emerald-700" />
        <StatCard label="Applications" value={stats.applications} gradient="from-blue-500 to-blue-700"       />
      </div>
    </div>
  );
}
