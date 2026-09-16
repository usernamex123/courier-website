import React, { useState } from "react";
import { User, Lock, Save, Edit2, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    if (!securityData.currentPassword) {
      errors.currentPassword = "Current password is required.";
      hasError = true;
    } else if (securityData.currentPassword !== currentDbPassword) {
      errors.currentPassword = "Incorrect current password.";
      hasError = true;
    }

    if (!securityData.newPassword) {
      errors.newPassword = "New password is required.";
      hasError = true;
    } else if (securityData.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters long.";
      hasError = true;
    } else if (securityData.newPassword === securityData.currentPassword) {
      errors.newPassword = "New password cannot be the same as your current password.";
      hasError = true;
    }

    if (!securityData.confirmPassword) {
      errors.confirmPassword = "Confirm password is required.";
      hasError = true;
    } else if (securityData.newPassword !== securityData.confirmPassword) {
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
      setCurrentDbPassword(securityData.newPassword);
      toast.success("Password updated successfully!");
      setSecurityData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSecurityErrors({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }, 800);
  };

  return (
    <div className="w-full px-1 sm:px-2 pt-0 pb-6 text-gray-900 bg-[#f8f9fa]">
      <div className="w-full">
        {/* Horizontal Attached Tabs */}
        <div className="flex items-end gap-2 px-2">
          {/* Profile Tab */}
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-t-xl border-t border-x transition-all cursor-pointer relative z-20 -mb-px ${
              activeTab === "profile"
                ? "bg-white border-gray-200 text-gray-900"
                : "bg-gray-100/90 border-gray-200 text-gray-600 hover:bg-gray-200/60"
            }`}
          >
            <div className={`p-1.5 rounded-lg border ${activeTab === "profile" ? "bg-yellow-100/60 border-yellow-300 text-yellow-600" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
              <User size={15} />
            </div>
            <span className="font-bold text-xs text-gray-900">
              Profile
            </span>
          </button>

          {/* Security Tab */}
          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-t-xl border-t border-x transition-all cursor-pointer relative z-20 -mb-px ${
              activeTab === "security"
                ? "bg-white border-gray-200 text-gray-900"
                : "bg-gray-100/90 border-gray-200 text-gray-600 hover:bg-gray-200/60"
            }`}
          >
            <div className={`p-1.5 rounded-lg border ${activeTab === "security" ? "bg-yellow-100/60 border-yellow-300 text-yellow-600" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
              <Lock size={15} />
            </div>
            <span className="font-bold text-xs text-gray-900">
              Security
            </span>
          </button>
        </div>

        {/* Main Content Card Attached Below */}
        <div className="bg-white border border-gray-200 rounded-b-2xl rounded-tr-2xl p-5 sm:p-6 shadow-sm relative z-10">
          {activeTab === "profile" && (
            <div>
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
            <div>
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-5">
                <div className="p-2 bg-yellow-100/60 border border-yellow-300 text-yellow-600 rounded-xl">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Security Settings</h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">Change your password to keep your account secure (Default: admin123)</p>
                </div>
              </div>

              <form onSubmit={handleSecuritySubmit} autoComplete="off" className="space-y-3.5 max-w-xl">
                {/* Current Password */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      autoComplete="new-password"
                      readOnly
                      onFocus={(e) => e.target.removeAttribute('readonly')}
                      value={securityData.currentPassword}
                      onChange={handleSecurityChange}
                      placeholder="••••••••••••"
                      className={`w-full bg-gray-50 border rounded-xl pl-3.5 pr-9 py-2 text-xs text-gray-900 focus:outline-none transition-colors ${
                        securityErrors.currentPassword ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-yellow-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {securityErrors.currentPassword && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium">{securityErrors.currentPassword}</p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      autoComplete="new-password"
                      readOnly
                      onFocus={(e) => e.target.removeAttribute('readonly')}
                      value={securityData.newPassword}
                      onChange={handleSecurityChange}
                      placeholder="••••••••••••"
                      className={`w-full bg-gray-50 border rounded-xl pl-3.5 pr-9 py-2 text-xs text-gray-900 focus:outline-none transition-colors ${
                        securityErrors.newPassword ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-yellow-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {securityErrors.newPassword && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium">{securityErrors.newPassword}</p>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      autoComplete="new-password"
                      readOnly
                      onFocus={(e) => e.target.removeAttribute('readonly')}
                      value={securityData.confirmPassword}
                      onChange={handleSecurityChange}
                      placeholder="••••••••••••"
                      className={`w-full bg-gray-50 border rounded-xl pl-3.5 pr-9 py-2 text-xs text-gray-900 focus:outline-none transition-colors ${
                        securityErrors.confirmPassword ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-yellow-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
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