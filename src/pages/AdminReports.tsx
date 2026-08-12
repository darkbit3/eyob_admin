import { useState } from 'react';
import {
  revenueData, userActivityData, categoryPerformanceData, paymentMethodsData, winnerStatsData
} from '../data/mockData';
import {
  BarChart3, Download, Calendar, Users, DollarSign, Trophy, CreditCard
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend
} from 'recharts';

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState<'revenue' | 'auctions' | 'users' | 'payments' | 'winners'>('revenue');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-08-08');
  const [exportToast, setExportToast] = useState(false);

  function handleExportCSV() {
    setExportToast(true);
    setTimeout(() => setExportToast(false), 2500);

    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeTab === 'revenue') {
      csvContent += 'Month,Revenue (ETB),Deposits,Refunds\n';
      revenueData.forEach(r => {
        csvContent += `${r.month},${r.revenue},${r.deposits},${r.refunds}\n`;
      });
    } else if (activeTab === 'users') {
      csvContent += 'Month,New Users,Active Bidders,Total Bids\n';
      userActivityData.forEach(u => {
        csvContent += `${u.month},${u.newUsers},${u.activeBidders},${u.totalBids}\n`;
      });
    } else {
      csvContent += 'Category,Auctions,Total Bids,Revenue (ETB)\n';
      categoryPerformanceData.forEach(c => {
        csvContent += `${c.category},${c.auctions},${c.totalBids},${c.revenue}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BidLow_${activeTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {exportToast && (
        <div className="fixed top-4 right-4 z-50 p-3 bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Download className="w-4 h-4" /> CSV Report File Downloaded Successfully!
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" /> Platform Analytics & Reports
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Audit high-volume bidding trends, payment gateway shares, user growth velocity, and platform margins.
          </p>
        </div>

        {/* Date Filter & Export Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1.5 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1" />
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none font-mono text-[11px]"
            />
            <span className="text-slate-600">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none font-mono text-[11px]"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-900/40 transition-all"
          >
            <Download className="w-4 h-4" /> Export CSV Report
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('revenue')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'revenue'
              ? 'bg-purple-600/10 text-purple-400 border-purple-500 font-bold'
              : 'text-slate-400 hover:text-slate-200 border-transparent'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Revenue Report
        </button>

        <button
          onClick={() => setActiveTab('auctions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'auctions'
              ? 'bg-purple-600/10 text-purple-400 border-purple-500 font-bold'
              : 'text-slate-400 hover:text-slate-200 border-transparent'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Auction Performance
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'users'
              ? 'bg-purple-600/10 text-purple-400 border-purple-500 font-bold'
              : 'text-slate-400 hover:text-slate-200 border-transparent'
          }`}
        >
          <Users className="w-4 h-4" /> User Activity
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'payments'
              ? 'bg-purple-600/10 text-purple-400 border-purple-500 font-bold'
              : 'text-slate-400 hover:text-slate-200 border-transparent'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Payments Breakdown
        </button>

        <button
          onClick={() => setActiveTab('winners')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'winners'
              ? 'bg-purple-600/10 text-purple-400 border-purple-500 font-bold'
              : 'text-slate-400 hover:text-slate-200 border-transparent'
          }`}
        >
          <Trophy className="w-4 h-4" /> Winners Report
        </button>
      </div>

      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-white mb-2">Monthly Revenue & Deposit Velocity</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155' }} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8B5CF6" name="Net Revenue (ETB)" />
                  <Bar dataKey="deposits" fill="#10B981" name="Gross Deposits" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="p-3">Period</th>
                  <th className="p-3">Net Revenue</th>
                  <th className="p-3">Gross Deposits</th>
                  <th className="p-3">Refunds Issued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                {revenueData.map(r => (
                  <tr key={r.month} className="hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-white">{r.month}</td>
                    <td className="p-3 text-purple-400 font-bold">{r.revenue.toLocaleString()} ETB</td>
                    <td className="p-3 text-emerald-400">{r.deposits.toLocaleString()} ETB</td>
                    <td className="p-3 text-slate-400">{r.refunds.toLocaleString()} ETB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'auctions' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-white mb-2">Category Performance & Bidding Density</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryPerformanceData}>
                  <XAxis dataKey="categoryShort" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155' }} />
                  <Bar dataKey="totalBids" fill="#3B82F6" name="Total Bids Submitted" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="p-3">Category</th>
                  <th className="p-3">Auctions Hosted</th>
                  <th className="p-3">Total Bids</th>
                  <th className="p-3">Generated Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {categoryPerformanceData.map(c => (
                  <tr key={c.category} className="hover:bg-slate-800/40 font-mono">
                    <td className="p-3 font-semibold text-white">{c.category}</td>
                    <td className="p-3">{c.auctions}</td>
                    <td className="p-3 text-blue-400 font-bold">{c.totalBids}</td>
                    <td className="p-3 text-purple-400 font-bold">{c.revenue.toLocaleString()} ETB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-white mb-2">User Registration & Bidding Activity</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userActivityData}>
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155' }} />
                  <Legend />
                  <Line type="monotone" dataKey="newUsers" stroke="#10B981" name="New User Signups" strokeWidth={2} />
                  <Line type="monotone" dataKey="activeBidders" stroke="#8B5CF6" name="Active Bidders" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="p-3">Month</th>
                  <th className="p-3">New Signups</th>
                  <th className="p-3">Active Bidders</th>
                  <th className="p-3">Total Bids Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                {userActivityData.map(u => (
                  <tr key={u.month} className="hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-white">{u.month}</td>
                    <td className="p-3 text-emerald-400 font-bold">+{u.newUsers}</td>
                    <td className="p-3 text-purple-400">{u.activeBidders}</td>
                    <td className="p-3 text-slate-300">{u.totalBids}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white">Payment Method Shares</h3>
              <p className="text-slate-400 text-xs mt-1">
                Distribution of deposit methods used by customers across Telebirr, CBE Birr, Bank Transfers, and Chapa.
              </p>
            </div>

            <div className="h-56 w-56 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentMethodsData} innerRadius={40} outerRadius={70} dataKey="value">
                    {paymentMethodsData.map(entry => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="p-3">Gateway Method</th>
                  <th className="p-3">Volume Share</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                {paymentMethodsData.map(p => (
                  <tr key={p.name} className="hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </td>
                    <td className="p-3 font-bold text-purple-400">{p.value}%</td>
                    <td className="p-3 text-emerald-400 font-bold">ACTIVE</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'winners' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-white mb-2">Automated Winner Efficiency Metrics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              {winnerStatsData.map(w => (
                <div key={w.name} className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <span className="text-slate-400 text-xs font-semibold">{w.name}</span>
                  <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{w.rate}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
