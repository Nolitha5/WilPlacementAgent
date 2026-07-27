/**
 * src/pages/auth/EmployerLoginScreen.jsx
 */
import { useState } from "react";
import { signIn }   from "../../services/auth";
import { Ico }      from "../../components/icons/Icons";
import { inputCls } from "../../utils/constants";

export function EmployerLoginScreen({ onAuth, onBack }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleLogin = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const profile = await signIn(email, password);
      if (profile.role !== "employer") { setError("This account is not registered as an Employer."); setLoading(false); return; }
      onAuth(profile);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-900 p-8 text-white text-center">
          <div className="text-4xl mb-3">🏢</div>
          <h1 className="text-xl font-bold">Employer Portal</h1>
          <p className="text-white/60 text-sm mt-1">WIL Placement Portal</p>
        </div>
        <div className="p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <Ico.X className="w-4 h-4 shrink-0"/>{error}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="" className={inputCls} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-semibold disabled:opacity-50 transition-all">
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>
          <button onClick={onBack} className="mt-4 w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-all">← Back to portal home</button>
        </div>
      </div>
    </div>
  );
}
