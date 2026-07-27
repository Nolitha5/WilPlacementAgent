/**
 * src/pages/auth/StudentAuthScreen.jsx
 * Sign-in + registration form for students.
 */
import { useState }    from "react";
import { signIn }      from "../../services/auth";
import { supabase }    from "../../lib/supabase";
import { Ico }         from "../../components/icons/Icons";
import { inputCls }    from "../../utils/constants";

export function StudentAuthScreen({ onAuth, onBack }) {
  const [mode,     setMode]     = useState("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]     = useState("");
  const [major,    setMajor]    = useState("");
  const [year,     setYear]     = useState("1st Year");
  const [avgMark,  setAvgMark]  = useState("");
  const [skills,   setSkills]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleLogin = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const profile = await signIn(email, password);
      if (profile.role !== "student") { setError("This account is not a Student account."); setLoading(false); return; }
      onAuth(profile);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const handleRegister = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) throw new Error(err.message);
      const uid = data.user?.id;
      if (!uid) throw new Error("Registration failed — please try again.");
      await supabase.from("profiles").insert({ id: uid, role: "student", name, email });
      await supabase.from("students").insert({
        id: uid, major, year,
        average_mark: parseFloat(avgMark) || null,
        skills: skills.split(",").map(s => s.trim()).filter(Boolean),
      });
      onAuth({
        id: uid, role: "student", name, email, major, year,
        average_mark: parseFloat(avgMark) || null,
        skills: skills.split(",").map(s => s.trim()).filter(Boolean),
      });
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-800 to-indigo-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-900 p-8 text-white text-center">
          <div className="text-4xl mb-3">👨‍🎓</div>
          <h1 className="text-xl font-bold">Student Portal</h1>
          <p className="text-white/60 text-sm mt-1">WIL Placement Portal</p>
        </div>
        <div className="p-8">
          {/* Mode toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {[["login","Sign In"],["register","Register"]].map(([m,l]) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode===m ? "bg-white shadow text-indigo-700" : "text-gray-500 hover:text-gray-700"}`}>{l}</button>
            ))}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <Ico.X className="w-4 h-4 shrink-0"/>{error}
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="" className={inputCls} /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="" className={inputCls} /></div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all">
                {loading ? "Signing in…" : "Sign In →"}
              </button>
              <p className="text-center text-xs text-gray-400">Don't have an account? <button type="button" onClick={()=>setMode("register")} className="text-indigo-600 font-semibold hover:underline">Register</button></p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                <input required value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Nomsa Dlamini" className={inputCls} /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="" className={inputCls} /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Password *</label>
                <input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="" className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Major</label>
                  <input value={major} onChange={e=>setMajor(e.target.value)} placeholder="e.g. Computer Science" className={inputCls} /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Year</label>
                  <select value={year} onChange={e=>setYear(e.target.value)} className={inputCls}>
                    {["1st Year","2nd Year","3rd Year","4th Year","Postgraduate"].map(y=><option key={y}>{y}</option>)}
                  </select></div>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Average Mark (%)</label>
                <input type="number" min="0" max="100" step="0.1" value={avgMark} onChange={e=>setAvgMark(e.target.value)} placeholder="e.g. 72" className={inputCls} /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Skills <span className="font-normal text-gray-400">(comma-separated)</span></label>
                <input value={skills} onChange={e=>setSkills(e.target.value)} placeholder="e.g. React, Python, SQL" className={inputCls} /></div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-all">
                {loading ? "Creating account…" : "Create Account →"}
              </button>
              <p className="text-center text-xs text-gray-400">Already registered? <button type="button" onClick={()=>setMode("login")} className="text-indigo-600 font-semibold hover:underline">Sign In</button></p>
            </form>
          )}
          <button onClick={onBack} className="mt-4 w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-all">← Back to portal home</button>
        </div>
      </div>
    </div>
  );
}
