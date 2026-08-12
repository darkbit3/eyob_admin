import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ADMIN_ROUTES } from '../utils/routes';
import {
  Users, Gavel, DollarSign, Clock, PlusCircle, BarChart2,
  TrendingUp, ArrowUpRight
} from 'lucide-react';
import {
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip
} from 'recharts';

export default function AdminDashboard() {
  const { auctions, users, transactions, currentUser, refreshCurrentUser } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalUsers = users.length;
  const activeAuctions = auctions.filter(a => a.status === 'active').length;
  const closingSoonAuctions = auctions.filter(a => a.status === 'active').slice(0, 3);
  const totalRevenue = transactions
    .filter(t => t.type === 'credit_purchase')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalBidsToday = auctions.reduce((acc, a) => acc + a.totalBids, 0);

  const revenueChartData = [
    { name: 'Feb', revenue: 14500 },
    { name: 'Mar', revenue: 22400 },
    { name: 'Apr', revenue: 19800 },
    { name: 'May', revenue: 31500 },
    { name: 'Jun', revenue: 38200 },
    { name: 'Jul', revenue: 49000 },
    { name: 'Aug', revenue: 28400 },
  ];

  const auctionStatusCount = [
    { name: 'Active', value: auctions.filter(a => a.status === 'active').length, color: '#10B981' },
    { name: 'Upcoming', value: auctions.filter(a => a.status === 'upcoming').length, color: '#3B82F6' },
    { name: 'Closed', value: auctions.filter(a => a.status === 'closed').length, color: '#6B7280' },
    { name: 'Paused', value: auctions.filter(a => a.status === 'paused').length, color: '#F59E0B' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 bg-gradient-to-r from-purple-900/80 via-slate-900 to-indigo-950 border border-purple-800/40 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Admin Overview</h1>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2 py-0.5 rounded border border-emerald-500/30">
              Live Engine Active
            </span>
          </div>
          <p className="text-slate-300 text-sm mt-1">
            Real-time monitoring of active bid streams, revenue metrics, and automated winner algorithms.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={ADMIN_ROUTES.AUCTIONS}
            className="flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-900/40 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Create Auction
          </Link>
          <Link
            to={ADMIN_ROUTES.REPORTS}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all"
          >
            <BarChart2 className="w-4 h-4" /> View Reports
          </Link>
          <Link
            to={ADMIN_ROUTES.USERS}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all"
          >
            <Users className="w-4 h-4" /> Manage Users
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Admin Balance</span>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  if (isRefreshing) return;
                  setIsRefreshing(true);
                  try { await refreshCurrentUser(); } catch (e) { /* ignore */ }
                  setIsRefreshing(false);
                }}
                disabled={isRefreshing}
                className={`text-xs px-2 py-1 rounded ${isRefreshing ? 'bg-slate-700 text-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}>
                {isRefreshing ? 'Refreshing…' : 'Refresh'}
              </button>
              <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{(currentUser?.walletBalance ?? 0).toLocaleString()} ETB</p>
          <div className="flex items-center gap-1 text-slate-400 text-xs font-medium mt-1">
            <span>Platform treasury</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Users</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalUsers}</p>
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium mt-1">
            <ArrowUpRight className="w-3 h-3" /> +14.2% this month
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Auctions</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Gavel className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{activeAuctions}</p>
          <div className="flex items-center gap-1 text-slate-400 text-xs font-medium mt-1">
            <span>{closingSoonAuctions.length} closing soon</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalRevenue.toLocaleString()} ETB</p>
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium mt-1">
            <ArrowUpRight className="w-3 h-3" /> +22.8% vs last month
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Bids Today</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalBidsToday}</p>
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium mt-1">
            <ArrowUpRight className="w-3 h-3" /> +8.5% peak velocity
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Closing Soon</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{closingSoonAuctions.length}</p>
          <div className="flex items-center gap-1 text-amber-400 text-xs font-medium mt-1">
            <span>Requires verification monitor</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Revenue Trend (ETB)</h2>
              <p className="text-slate-400 text-xs">Monthly credit purchases and platform transactions</p>
            </div>
            <span className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-1 rounded-lg">
              2026 YTD
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChartData}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#FFF' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#A855F7', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Auctions Distribution</h2>
            <p className="text-slate-400 text-xs">Breakdown by current lifecycle status</p>
          </div>

          <div className="h-48 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={auctionStatusCount}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {auctionStatusCount.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-3">
            {auctionStatusCount.map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Closing Soon */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" /> Auctions Closing Soon
            </h2>
            <Link to={ADMIN_ROUTES.AUCTIONS} className="text-xs text-purple-400 hover:text-purple-300 font-medium">
              View All →
            </Link>
          </div>

          <div className="space-y-3">
            {closingSoonAuctions.map(a => (
              <div key={a.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                <img src={a.image} alt={a.title} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{a.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Retail: <span className="text-slate-200">{a.retailValue.toLocaleString()} ETB</span> • {a.totalBids} bids
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    Live
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
