import React, { useState, useEffect } from "react";
import { Loader2, Save, User, Phone, MapPin, Mail, Lock, X, Key } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabaseClient";

export default function CustomerProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userCode, setUserCode] = useState("");
  const [userEmail, setUserEmail] = useState("");
  
  // Password modal states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: ""
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // 1. Get the real logged-in user from Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error("Not authenticated");
        return;
      }

      setUserEmail(user.email || "");

      // 2. Fetch the immutable 6-digit ID and profile details from the profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error fetching profile:", profileError.message);
      }

      if (profileData) {
        setUserCode(profileData.customer_id || "");
        setFormData({
          full_name: profileData.full_name || user.user_metadata?.full_name || "",
          phone: profileData.phone || "",
          address: profileData.address || "",
          city: profileData.city || "",
          state: profileData.state || "",
          postal_code: profileData.postal_code || ""
        });
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChangeInput = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No active user session");

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Error saving profile:", err.message);
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    setPasswordSaving(true);

    try {
      // 1. Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: passwordForm.currentPassword
      });

      if (signInError) {
        toast.error("Incorrect current password.");
        setPasswordSaving(false);
        return;
      }

      // 2. If current password is correct, update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (updateError) throw updateError;

      toast.success("Password changed successfully!");
      setIsPasswordModalOpen(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error("Error changing password:", err.message);
      toast.error("Failed to change password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-16 text-center flex flex-col items-center justify-center shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500 mb-2" />
        <p className="text-sm text-slate-500">Loading profile...</p>
      </div>
    );
  }

  const initials = formData.full_name ? formData.full_name.charAt(0).toUpperCase() : (userEmail ? userEmail.charAt(0).toUpperCase() : "U");

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans pb-12 relative">
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
        
        {/* Header Profile Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-yellow-400 text-black font-bold text-2xl flex items-center justify-center shadow-inner">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{formData.full_name || "Valued Customer"}</h1>
              <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                <span>{userEmail}</span>
              </div>
              
              {/* Customer Badge & Plain Text User ID */}
              <div className="flex items-center gap-3 mt-2">
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full">
                  Customer
                </span>
                {userCode && (
                  <span className="text-xs font-mono text-slate-500">
                    user-id : {userCode}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Input Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>
            <div className="relative flex items-center">
              <User className="absolute left-3 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                name="full_name"
                value={formData.full_name} 
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-900 outline-none focus:bg-white focus:border-yellow-400 transition-colors" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Phone Number</label>
            <div className="relative flex items-center">
              <Phone className="absolute left-3 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                name="phone"
                value={formData.phone} 
                onChange={handleChange}
                placeholder="+1 (000) 000-0000"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-900 outline-none focus:bg-white focus:border-yellow-400 transition-colors" 
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Billing Email (Read-Only)</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-slate-400" />
              <input 
                type="email" 
                value={userEmail} 
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-500 cursor-not-allowed" 
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Street Address</label>
            <div className="relative flex items-center">
              <MapPin className="absolute left-3 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                name="address"
                value={formData.address} 
                onChange={handleChange}
                placeholder="Street address or locality"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-900 outline-none focus:bg-white focus:border-yellow-400 transition-colors" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">City</label>
            <input 
              type="text" 
              name="city"
              value={formData.city} 
              onChange={handleChange}
              placeholder="City"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 outline-none focus:bg-white focus:border-yellow-400 transition-colors" 
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">State / Province</label>
            <input 
              type="text" 
              name="state"
              value={formData.state} 
              onChange={handleChange}
              placeholder="State"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 outline-none focus:bg-white focus:border-yellow-400 transition-colors" 
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Postal Code</label>
            <input 
              type="text" 
              name="postal_code"
              value={formData.postal_code} 
              onChange={handleChange}
              placeholder="Postal Code"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 outline-none focus:bg-white focus:border-yellow-400 transition-colors" 
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button 
            type="button" 
            onClick={() => setIsPasswordModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-sm transition-colors"
          >
            <Key className="w-4 h-4 text-slate-500" />
            Change Password
          </button>

          <button 
            type="submit" 
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>

      </form>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                <Lock className="w-5 h-5 text-yellow-500" />
                <h2>Change Password</h2>
              </div>
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Current Password</label>
                <input 
                  type="password" 
                  name="currentPassword"
                  required
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChangeInput}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 outline-none focus:bg-white focus:border-yellow-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">New Password</label>
                <input 
                  type="password" 
                  name="newPassword"
                  required
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChangeInput}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 outline-none focus:bg-white focus:border-yellow-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  name="confirmPassword"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChangeInput}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 outline-none focus:bg-white focus:border-yellow-400 transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={passwordSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {passwordSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}