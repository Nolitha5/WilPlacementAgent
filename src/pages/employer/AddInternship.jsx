/**
 * src/pages/employer/AddInternship.jsx
 */
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Ico }      from "../../components/icons/Icons";
import { Toast, PageHeader } from "../../components/ui";
import { inputCls } from "../../utils/constants";

export function AddInternship({ profile }) {
  const [form,   setForm]   = useState({ internshipName: "", type: "Full-Time", location: "", duration: "", description: "", skillsInput: "" });
  const [saving, setSaving] = useState(false);
  const [toast,  setToast]  = useState(null);

  const showToast = (message, t = "success") => { setToast({ message, type: t }); setTimeout(() => setToast(null), 3000); };
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from("internships").insert({
      employer_id:     profile.id,
      company_name:    profile.company,
      internship_name: form.internshipName,
      type:            form.type,
      location:        form.location,
      duration:        form.duration,
      description:     form.description,
      skills_required: form.skillsInput.split(",").map(s => s.trim()).filter(Boolean),
      posted_date:     new Date().toISOString().split("T")[0],
    });
    if (error) {
      showToast(error.message, "error");
    } else {
      setForm({ internshipName: "", type: "Full-Time", location: "", duration: "", description: "", skillsInput: "" });
      showToast("Internship posted successfully!");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {toast && <Toast {...toast} />}
      <PageHeader title="Add Internship Programme" sub="Create a new listing for students to discover and apply to." />
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Name</label>
          <input value={profile.company || ""} disabled className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Internship Name *</label>
          <input required value={form.internshipName} onChange={set("internshipName")} placeholder="e.g. Frontend Developer Intern" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type *</label>
            <select value={form.type} onChange={set("type")} className={inputCls}>
              <option>Full-Time</option>
              <option>Part-Time</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Duration *</label>
            <input required value={form.duration} onChange={set("duration")} placeholder="e.g. 6 Months" className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location *</label>
          <input required value={form.location} onChange={set("location")} placeholder="e.g. Cape Town (Hybrid)" className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Skills Required * <span className="font-normal text-gray-400">(comma-separated)</span>
          </label>
          <input required value={form.skillsInput} onChange={set("skillsInput")} placeholder="e.g. React, JavaScript, Node.js" className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
          <textarea value={form.description} onChange={set("description")} rows={3} placeholder="Describe the role…" className={`${inputCls} resize-none`} />
        </div>
        <button type="submit" disabled={saving}
          className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50">
          <Ico.Plus className="w-4 h-4" /> {saving ? "Posting…" : "Post Internship"}
        </button>
      </form>
    </div>
  );
}
