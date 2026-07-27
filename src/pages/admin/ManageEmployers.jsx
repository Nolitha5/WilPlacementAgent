/**
 * src/pages/admin/ManageEmployers.jsx
 * Admin registers employers; they sign in immediately on the Employer portal.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase }     from "../../lib/supabase";
import { Ico }          from "../../components/icons/Icons";
import { Spinner, Toast, ConfirmModal, PageHeader } from "../../components/ui";
import { inputCls }     from "../../utils/constants";

export function ManageEmployers() {
  const [employers,  setEmployers]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [form,       setForm]       = useState({ name:"", email:"", password:"", company:"", location:"" });
  const [saving,     setSaving]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast,      setToast]      = useState(null);

  const showToast = (msg, type="success") => { setToast({ message:msg, type }); setTimeout(()=>setToast(null),3500); };

  const load = useCallback(async () => {
    setLoading(true);
    const { data: emp } = await supabase
      .from("employers")
      .select("id, company, location, profiles(name, email)")
      .order("created_at", { ascending: false });
    setEmployers(emp || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleAdd = async ev => {
    ev.preventDefault(); setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-employer", {
        body: {
          name:     form.name,
          email:    form.email.toLowerCase().trim(),
          password: form.password,
          company:  form.company,
          location: form.location,
        },
      });
      if (error)      throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setForm({ name:"", email:"", password:"", company:"", location:"" });
      showToast(`Employer account created for ${form.company}. They can now sign in on the Employer portal.`);
      load();
    } catch (err) { showToast(err.message, "error"); }
    setSaving(false);
  };

  const handleDelete = async id => {
    await supabase.from("employers").delete().eq("id", id);
    setConfirmDel(null);
    showToast("Employer removed.");
    load();
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}
      <PageHeader title="Manage Employers" sub="Register employer accounts. They can sign in immediately with the credentials you set." />

      {/* Add employer form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-700 mb-5 flex items-center gap-2">
          <Ico.Plus className="w-4 h-4" /> Register New Employer
        </h2>
        <form onSubmit={handleAdd} className="grid md:grid-cols-2 gap-4">
          {[
            ["Contact Name",  "name",     "e.g. Sarah Nkosi",       "text"],
            ["Contact Email", "email",    "sarah@company.co.za",    "email"],
            ["Password",      "password", "Min. 6 characters",      "password"],
            ["Company Name",  "company",  "e.g. TechSA Solutions",  "text"],
            ["Location",      "location", "e.g. Johannesburg",      "text"],
          ].map(([label, key, placeholder, type]) => (
            <div key={key} className={key === "location" ? "md:col-span-2" : ""}>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label} *</label>
              <input required type={type} minLength={key==="password"?6:undefined}
                value={form[key]} onChange={set(key)} placeholder={placeholder} className={inputCls} />
            </div>
          ))}
          <div className="md:col-span-2">
            <button type="submit" disabled={saving}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              <Ico.Plus className="w-4 h-4" /> {saving ? "Creating account…" : "Create Employer Account"}
            </button>
          </div>
        </form>
      </div>

      {/* Registered employers list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Registered Employers ({employers.length})</h2>
        {loading ? <Spinner /> : employers.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">No employers registered yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {employers.map(e => (
              <div key={e.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                    {e.company[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{e.company}</p>
                    <p className="text-xs text-gray-500">{e.profiles?.name} · {e.profiles?.email}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Ico.MapPin />{e.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">Active</span>
                  <button onClick={() => setConfirmDel({ id: e.id })} className="p-1.5 text-red-400 hover:bg-red-50 rounded-xl">
                    <Ico.Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDel && (
        <ConfirmModal
          message="Remove this employer?"
          sub="Their listings and applications will also be removed."
          onConfirm={() => handleDelete(confirmDel.id)}
          onCancel={() => setConfirmDel(null)}
          confirmLabel="Remove"
        />
      )}
    </div>
  );
}
