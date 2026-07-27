/**
 * src/pages/employer/EmployerDashboard.jsx
 */
import { useState, useEffect } from "react";
import { supabase }            from "../../lib/supabase";
import { Spinner, StatCard, PageHeader } from "../../components/ui";

export function EmployerDashboard({ profile }) {
  const [stats,   setStats]   = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: listings } = await supabase.from("internships").select("id").eq("employer_id", profile.id);
      const ids = (listings || []).map(i => i.id);
      const { count: appCount }  = ids.length ? await supabase.from("applications").select("id",{count:"exact",head:true}).in("internship_id", ids) : { count: 0 };
      const { count: pending }   = ids.length ? await supabase.from("applications").select("id",{count:"exact",head:true}).in("internship_id",ids).eq("status","pending")   : { count: 0 };
      const { count: interview } = ids.length ? await supabase.from("applications").select("id",{count:"exact",head:true}).in("internship_id",ids).eq("status","interview") : { count: 0 };
      setStats({ listings: listings?.length||0, applications: appCount||0, pending: pending||0, interviews: interview||0 });
      setLoading(false);
    }
    load();
  }, [profile.id]);

  if (loading) return <Spinner />;
  return (
    <div className="space-y-6">
      <PageHeader title="Employer Dashboard" sub={`${profile.company || ""} · ${profile.location || ""}`} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="My Listings"      value={stats.listings}      gradient="from-emerald-500 to-emerald-700" />
        <StatCard label="Total Applicants" value={stats.applications}  gradient="from-indigo-500 to-indigo-700"   />
        <StatCard label="Interviews"       value={stats.interviews}    gradient="from-blue-500 to-blue-700"       />
        <StatCard label="Pending Review"   value={stats.pending}       gradient="from-amber-400 to-orange-500"    />
      </div>
    </div>
  );
}
