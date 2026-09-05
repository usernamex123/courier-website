import React, { useState } from "react";
import { User, Lock, Save, Edit2, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    fullName: "Admin User",
    email: "admin@jblogisticsservices.com",
    phone: "+1 (216) 569-5350"
  });

  // Simulated Database Password and Security Form State
  const [currentDbPassword, setCurrentDbPassword] = useState("admin123"); 
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Error States
  const [securityErrors, setSecurityErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSecurityChange = (e) => {
    setSecurityData({ ...securityData, [e.target.name]: e.target.value });
    // Clear specific error when user starts typing
    if (securityErrors[e.target.name]) {
      setSecurityErrors({ ...securityErrors, [e.target.name]: "" });
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsEditingProfile(false);
      toast.success("Profile information updated successfully!");
    }, 800);
  };

  const handleSecuritySubmit = (e) => {
    e.preventDefault();
    let errors = { currentPassword: "", newPassword: "", confirmPassword: "" };
    let hasError = false;

    // Check if current password is empty
    if (!securityData.currentPassword) {
      errors.currentPassword = "Current password is required.";
      hasError = true;
    } 
    // Check if current password matches database
    else if (securityData.currentPassword !== currentDbPassword) {
      errors.currentPassword = "Incorrect current password.";
      hasError = true;
    }

    // Check if new password is empty
    if (!securityData.newPassword) {
      errors.newPassword = "New password is required.";
      hasError = true;
    } 
    // Check minimum length
    else if (securityData.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters long.";
      hasError = true;
    } 
    // Check if new password is the same as current password
    else if (securityData.newPassword === securityData.currentPassword) {
      errors.newPassword = "New password cannot be the same as your current password.";
      hasError = true;
    }

    // Check if confirm password is empty
    if (!securityData.confirmPassword) {
      errors.confirmPassword = "Confirm password is required.";
      hasError = true;
    } 
    // Check if new password and confirm password match
    else if (securityData.newPassword !== securityData.confirmPassword) {
      errors.confirmPassword = "New passwords do not match.";
      hasError = true;
    }

    setSecurityErrors(errors);

    if (hasError) {
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCurrentDbPassword(securityData.newPassword); // Update simulated database password
      toast.success("Password updated successfully!");
      setSecurityData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSecurityErrors({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }, 800);
  };

  return (
    <div className="w-full px-1 sm:px-2 pt-0 pb-6 text-gray-900 bg-[#f8f9fa] min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-2.5">
          
          {/* Profile Nav Item */}
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer relative overflow-hidden ${
              activeTab === "profile"
                ? "bg-amber-50/70 border-amber-200 shadow-sm"
                : "bg-white border-gray-200 hover:border-gray-300 text-gray-700"
            }`}
          >
            {activeTab === "profile" && (
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-yellow-500" />
            )}
            <div className={`p-2 rounded-xl border ${activeTab === "profile" ? "bg-yellow-100/60 border-yellow-300 text-yellow-600" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
              <User size={18} />
            </div>
            <div>
              <h3 className={`font-bold text-xs ${activeTab === "profile" ? "text-gray-900" : "text-gray-800"}`}>
                Profile
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Admin profile information</p>
            </div>
          </button>

          {/* Security Nav Item */}
          <button
            onClick={() => setActiveTab("security")}
            className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer relative overflow-hidden ${
              activeTab === "security"
                ? "bg-amber-50/70 border-amber-200 shadow-sm"
                : "bg-white border-gray-200 hover:border-gray-300 text-gray-700"
            }`}
          >
            {activeTab === "security" && (
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-yellow-500" />
            )}
            <div className={`p-2 rounded-xl border ${activeTab === "security" ? "bg-yellow-100/60 border-yellow-300 text-yellow-600" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
              <Lock size={18} />
            </div>
            <div>
              <h3 className={`font-bold text-xs ${activeTab === "security" ? "text-gray-900" : "text-gray-800"}`}>
                Security
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Change password</p>
            </div>
          </button>

        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-8 space-y-4">
          
          {activeTab === "profile" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100/60 border border-yellow-300 text-yellow-600 rounded-xl">
                    <User size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Admin Profile</h2>
                    <p className="text-[11px] text-gray-500 mt-0.5">Update your personal information</p>
                  </div>
                </div>
                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[11px] font-bold transition-all cursor-pointer"
                  >
                    <Edit2 size={12} />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {!isEditingProfile ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-1">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Full Name</span>
                    <span className="text-xs font-semibold text-gray-800">{profileData.fullName}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Email Address</span>
                    <span className="text-xs font-semibold text-gray-800 break-all">{profileData.email}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Phone Number</span>
                    <span className="text-xs font-semibold text-gray-800">{profileData.phone}</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProfileSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Full Name</label>
                      <input
                        type="text"
                        name="fullName"
                        value={profileData.fullName}
                        onChange={handleProfileChange}
                        required
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-yellow-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Phone Number</label>
                      <input
                        type="text"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-yellow-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-yellow-500 transition-colors"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-gray-600 text-[11px] font-bold hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-[11px] px-4 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save size={13} />}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === "security" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-5">
                <div className="p-2 bg-yellow-100/60 border border-yellow-300 text-yellow-600 rounded-xl">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Security Settings</h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">Change your password to keep your account secure (Default: admin123)</p>
                </div>
              </div>

              <form onSubmit={handleSecuritySubmit} className="space-y-3.5 max-w-xl">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={securityData.currentPassword}
                    onChange={handleSecurityChange}
                    placeholder="••••••••••••"
                    className={`w-full bg-gray-50 border rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none transition-colors ${
                      securityErrors.currentPassword ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-yellow-500"
                    }`}
                  />
                  {securityErrors.currentPassword && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium">{securityErrors.currentPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={securityData.newPassword}
                    onChange={handleSecurityChange}
                    placeholder="••••••••••••"
                    className={`w-full bg-gray-50 border rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none transition-colors ${
                      securityErrors.newPassword ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-yellow-500"
                    }`}
                  />
                  {securityErrors.newPassword && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium">{securityErrors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={securityData.confirmPassword}
                    onChange={handleSecurityChange}
                    placeholder="••••••••••••"
                    className={`w-full bg-gray-50 border rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none transition-colors ${
                      securityErrors.confirmPassword ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-yellow-500"
                    }`}
                  />
                  {securityErrors.confirmPassword && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium">{securityErrors.confirmPassword}</p>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-[11px] px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock size={13} />}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}