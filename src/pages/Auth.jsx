import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, UserPlus, Mail, Lock, AlertCircle, Eye, EyeOff, User } from "lucide-react";

function Auth() {
  const { loginWithEmail, signUpWithEmail, loginWithGoogle } = useApp();
  
  const [isLoginStage, setIsLoginStage] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // Official Google Button Initialization
  useEffect(() => {
    const initGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "612496809464-9bokjlq3tkumnh5tf5ammgkfbcnca7s1.apps.googleusercontent.com", // REPLACE WITH YOUR ID
          callback: async () => {
            try {
              setLoading(true);
              await loginWithGoogle();
              navigate("/dashboard");
            } catch (err) {
              setError(err.message);
            } finally {
              setLoading(false);
            }
          },
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-button-container"),
          { theme: "outline", size: "large", width: "384" }
        );
      }
    };
    initGoogle();
  }, [loginWithGoogle, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isLoginStage && password !== confirmPassword) return setError("Passwords do not match.");

    setLoading(true);
    try {
      if (isLoginStage) await loginWithEmail(email, password);
      else await signUpWithEmail(email, password, username);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message.replace("Firebase:", "").replace("auth/", "").replaceAll("-", " "));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center pt-24 px-5">
      <div className="absolute w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div className="w-full max-w-md bg-slate-900/40 border border-slate-900 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10">
        <h2 className="text-2xl font-black tracking-tight text-center mb-2">
          {isLoginStage ? "Welcome Back" : "Create Account"}
        </h2>
        <p className="text-sm text-slate-400 text-center mb-6">
          {isLoginStage ? "Access your high-fidelity tracking metrics" : "Register your core logistics dashboard lanes"}
        </p>

        {error && <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl flex items-center gap-2"><AlertCircle size={14} />{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginStage && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-slate-500" size={16} />
                <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-3 pl-12 pr-4 text-sm text-slate-200" placeholder="username" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-500" size={16} />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-3 pl-12 pr-4 text-sm text-slate-200" placeholder="name@company.com" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-500" size={16} />
              <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-3 pl-12 pr-12 text-sm text-slate-200" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-500">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>

          {!isLoginStage && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-500" size={16} />
                <input type={showConfirmPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-3 pl-12 pr-12 text-sm text-slate-200" placeholder="••••••••" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-3.5 text-slate-500">{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full mt-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-sm transition shadow-lg shadow-blue-500/5">
            {loading ? "Processing..." : isLoginStage ? "Sign In" : "Register"}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-x-0 h-[1px] bg-slate-800/60" />
          <span className="relative z-10 px-3 bg-[#0c1322] text-[10px] font-bold text-slate-500 uppercase tracking-widest">Or</span>
        </div>

        {/* Real Google Button Container */}
        <div id="google-button-container" className="flex justify-center"></div>

        <div className="mt-6 text-center">
          <button type="button" onClick={() => { setIsLoginStage(!isLoginStage); setError(""); }} className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
            {isLoginStage ? "New to SwiftShip? Open an account" : "Already have an account? Sign In"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default Auth;