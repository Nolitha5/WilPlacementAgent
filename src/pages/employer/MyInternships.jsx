/**
 * src/pages/employer/MyInternships.jsx
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Ico }      from "../../components/icons/Icons";
import { Toast, Spinner, PageHeader, ConfirmModal } from "../../components/ui";

export function MyInternships({ profile }) {
  const [listings,   setListings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast,      setToast]      = useState(null);

  const showToast = (message, t = "success") => { setToast({ message, type: t }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("internships").select("*").eq("employer_id", profile.id).order("created_at", { ascending: false });
    setListings(data || []);
    setLoading(false);
  }, [profile.id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async id => {
    await supabase.from("internships").delete().eq("id", id);
    setConfirmDel(null);
    showToast("Listing removed.");
    load();
  };

  if (loading) return <Spinner />;
  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}
      <PageHeader title="My Internships" sub={`${listings.length} active listing${listings.length !== 1 ? "s" : ""}`} />

      {listings.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl">
          <Ico.Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No listings yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map(i => (
            <div key={i.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800">{i.internship_name}</h3>
                  <p className="text-emerald-700 font-medium text-sm">{i.company_name}</p>
                </div>
                <button onClick={() => setConfirmDel(i.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-xl">
                  <Ico.Trash className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1"><Ico.Tag />{i.type}</span>
                <span className="flex items-center gap-1"><Ico.MapPin />{i.location}</span>
                <span className="flex items-center gap-1"><Ico.Clock />{i.duration}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(i.skills_required || []).map(s => (
                  <span key={s} className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">{s}</span>
                ))}
              </div>
              {i.description && <p className="text-xs text-gray-400 mt-3">{i.description}</p>}
            </div>
          ))}
        </div>
      )}

      {confirmDel && (
        <ConfirmModal
          message="Remove this listing?"
          sub="All related applications will also be removed."
          onConfirm={() => handleDelete(confirmDel)}
          onCancel={() => setConfirmDel(null)}
          confirmLabel="Remove"
        />
      )}
    </div>
  );
}
