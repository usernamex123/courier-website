import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ icon: Icon, label, value, change, changeType, color = "blue" }) {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col justify-between transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorStyles[color] || colorStyles.blue}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        {change && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
            changeType === "up" ? "bg-green-50 text-green-600" : "bg-rose-50 text-rose-600"
          }`}>
            {changeType === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change}
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-black text-gray-900 tracking-tight">{value}</div>
        <div className="text-xs font-medium text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}