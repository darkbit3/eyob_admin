import { useState, useEffect } from 'react';
import { reportsApi } from '../utils/api';
import {
  BarChart3, Download, Calendar, Users, DollarSign, Trophy, CreditCard, Loader2
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend
} from 'recharts';

const PIE_COLORS = ['#8B5CF6', '#10B981', '#3B82F6', '#F59E0B'];

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState<'revenue' | 'auctions' | 'users' | 'payments' | 'winners'>('revenue');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportToast, setExportToast] = useState(false);

  // Data state
  const [revenueData, setRevenueData]     = useState<any[]>([]);
  const [userActivityData, setUserActivityData] = useState<any[]>([]);
  const [categoryData, setCategoryData]   = useState<any[]>([]);
  const [paymentData, setPaymentData]     = useState<any[]>([]);
  const [winnerStats, setWinnerStats]     = useState<any>(null);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  useEffect(() => {
    async function fetchTab() {
      setLoading(true);
      setError('');
      try {
        if (activeTab === 'revenue') {
          const res = await reportsApi.revenue({ date_from: startDate || undefined, date_to: endDate || undefined });
          setRevenueData(res.data || []);
        } else if (activeTab === 'users') {
          const res = await reportsApi.users({ date_from: startDate || undefined, date_to: endDate || undefined });
          setUserActivityData((res.data || []).map((r: any) => ({
            month: r.month,
            newUsers: Number(r.new_users || 0),
          })));
        } else if (activeTab === 'auctions') {
          const res = await reportsApi.categories({ date_from: startDate || undefined, date_to: endDate || undefined });
          setCategoryData((res.data || []).map((r: any) => ({
            category: r.category,
            categoryShort: String(r.category || '').slice(0, 8),
            auctions: Number(r.auctions || 0),
            totalBids: Number(r.total_bids || 0),
            revenue: Number(r.total_retail_value || 0),
          })));
        } else if (activeTab === 'payments') {
          const res = await reportsApi.payments({ date_from: startDate || undefined, date_to: endDate || undefined });
          setPaymentData((res.data || []).map((r: any, i: number) => ({
            name: r.payment_method,
            value: Number(r.transaction_count || 0),
            total: Number(r.total_amount || 0),
            color: PIE_COLORS[i % PIE_COLORS.length],
          })));
        } else if (activeTab === 'winners') {
          const res = await reportsApi.winnerStats({ date_from: startDate || undefined, date_to: endDate || undefined });
          setWinnerStats(res.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load report data.');
      } finally {
        setLoading(false);
      }
    }
    fetchTab();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, startDate, endDate]);

  useEffect(() => {
    reportsApi.dashboard()
      .then(res => setDashboardStats(res.data))
      .catch(() => setDashboardStats(null));
  }, []);

  function handleExportCSV() {
    setExportToast(true);
    setTimeout(() => setExportToast(false), 2500);

    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeTab === 'revenue') {
      csvContent += 'Month,Revenue (ETB),Deposits,Refunds\n';
      revenueData.forEach((r: any) => {
        csvContent += `${r.month},${r.revenue},${r.deposits},${r.refunds}\n`;
      });
    } else if (activeTab === 'users') {
      csvContent += 'Month,New Users\n';
      userActivityData.forEach((u: any) => {
        csvContent += `${u.month},${u.newUsers}\n`;
      });
    } else if (activeTab === 'auctions') {
      csvContent += 'Category,Auctions,Total Bids,Retail Value (ETB)\n';
      categoryData.forEach((c: any) => {
        csvContent += `${c.category},${c.auctions},${c.totalBids},${c.revenue}\n`;
      });
    } else if (activeTab === 'payments') {
      csvContent += 'Gateway Method,Transactions,Total Amount (ETB)\n';
      paymentData.forEach((p: any) => {
        csvContent += `${p.name},${p.value},${p.total}\n`;
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

  function TabButton({ id, label, icon }: { id: typeof activeTab; label: string; icon: React.ReactNode }) {
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
          activeTab === id
            ? 'bg-purple-600/10 text-purple-400 border-purple-500 font-bold'
            : 'text-slate-400 hover:text-slate-200 border-transparent'
        }`}
      >
        {icon} {label}
      </button>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
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
            Live database-driven charts and tables. All data reflects real platform activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1.5 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1" />
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none font-mono text-[11px]" />
            <span className="text-slate-600">to</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none font-mono text-[11px]" />
          </div>
          <button onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-900/40 transition-all">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {dashboardStats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total Users', value: dashboardStats.total_users, color: 'text-blue-400' },
            { label: 'Active Users', value: dashboardStats.active_users, color: 'text-emerald-400' },
            { label: 'Total Auctions', value: dashboardStats.total_auctions, color: 'text-purple-400' },
            { label: 'Active Auctions', value: dashboardStats.active_auctions, color: 'text-amber-400' },
            { label: 'Total Revenue', value: `${Number(dashboardStats.total_revenue_etb || 0).toLocaleString()} ETB`, color: 'text-emerald-400' },
            { label: 'Pending Payments', value: dashboardStats.pending_payments, color: 'text-rose-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">{stat.label}</p>
              <p className={`text-xl font-black font-mono mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-1">
        <TabButton id="revenue"  label="Revenue"             icon={<DollarSign className="w-4 h-4" />} />
        <TabButton id="auctions" label="Auction Performance" icon={<BarChart3 className="w-4 h-4" />} />
        <TabButton id="users"    label="User Activity"       icon={<Users className="w-4 h-4" />} />
        <TabButton id="payments" label="Payments Breakdown"  icon={<CreditCard className="w-4 h-4" />} />
        <TabButton id="winners"  label="Winners Report"      icon={<Trophy className="w-4 h-4" />} />
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading report data…
        </div>
      )}
      {error && !loading && (
        <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* ── Revenue ───────────────────────────────────────────────────────── */}
      {!loading && !error && activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-white mb-2">Monthly Revenue & Deposit Velocity</h3>
            {revenueData.length === 0 ? (
              <p className="text-slate-500 text-xs py-10 text-center">No revenue data yet.</p>
            ) : (
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
            )}
          </div>
          {revenueData.length > 0 && (
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
                  {revenueData.map((r: any) => (
                    <tr key={r.month} className="hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-white">{r.month}</td>
                      <td className="p-3 text-purple-400 font-bold">{Number(r.revenue || 0).toLocaleString()} ETB</td>
                      <td className="p-3 text-emerald-400">{Number(r.deposits || 0).toLocaleString()} ETB</td>
                      <td className="p-3 text-slate-400">{Number(r.refunds || 0).toLocaleString()} ETB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Auctions ──────────────────────────────────────────────────────── */}
      {!loading && !error && activeTab === 'auctions' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-white mb-2">Category Performance & Bidding Density</h3>
            {categoryData.length === 0 ? (
              <p className="text-slate-500 text-xs py-10 text-center">No auction data yet.</p>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <XAxis dataKey="categoryShort" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155' }} />
                    <Bar dataKey="totalBids" fill="#3B82F6" name="Total Bids Submitted" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          {categoryData.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Category</th>
                    <th className="p-3">Auctions Hosted</th>
                    <th className="p-3">Total Bids</th>
                    <th className="p-3">Total Retail Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {categoryData.map((c: any) => (
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
          )}
        </div>
      )}

      {/* ── Users ─────────────────────────────────────────────────────────── */}
      {!loading && !error && activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-white mb-2">User Registration Growth</h3>
            {userActivityData.length === 0 ? (
              <p className="text-slate-500 text-xs py-10 text-center">No user registration data yet.</p>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userActivityData}>
                    <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155' }} />
                    <Legend />
                    <Line type="monotone" dataKey="newUsers" stroke="#10B981" name="New User Signups" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          {userActivityData.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Month</th>
                    <th className="p-3">New Signups</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                  {userActivityData.map((u: any) => (
                    <tr key={u.month} className="hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-white">{u.month}</td>
                      <td className="p-3 text-emerald-400 font-bold">+{u.newUsers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Payments ──────────────────────────────────────────────────────── */}
      {!loading && !error && activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white">Payment Method Shares</h3>
              <p className="text-slate-400 text-xs mt-1">Distribution of deposit methods used by customers.</p>
            </div>
            {paymentData.length > 0 && (
              <div className="h-56 w-56 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentData} innerRadius={40} outerRadius={70} dataKey="value">
                      {paymentData.map((entry: any) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          {paymentData.length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-4">No payment data yet.</p>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Gateway Method</th>
                    <th className="p-3">Transactions</th>
                    <th className="p-3">Total Amount (ETB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                  {paymentData.map((p: any) => (
                    <tr key={p.name} className="hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </td>
                      <td className="p-3 font-bold text-purple-400">{p.value}</td>
                      <td className="p-3 text-emerald-400">{Number(p.total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Winners ───────────────────────────────────────────────────────── */}
      {!loading && !error && activeTab === 'winners' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-white mb-4">Automated Winner Efficiency Metrics</h3>
            {!winnerStats ? (
              <p className="text-slate-500 text-xs text-center py-8">No winner data yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <span className="text-slate-400 text-xs font-semibold">Closed Auctions</span>
                  <p className="text-2xl font-black text-white font-mono mt-1">{winnerStats.total_closed_auctions}</p>
                </div>
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <span className="text-slate-400 text-xs font-semibold">With Winner</span>
                  <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{winnerStats.auctions_with_winner}</p>
                </div>
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <span className="text-slate-400 text-xs font-semibold">Avg Winning Bid</span>
                  <p className="text-2xl font-black text-amber-400 font-mono mt-1">{Number(winnerStats.avg_winning_bid).toFixed(2)} ETB</p>
                </div>
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <span className="text-slate-400 text-xs font-semibold">Total Bids Cast</span>
                  <p className="text-2xl font-black text-blue-400 font-mono mt-1">{winnerStats.total_bids_cast}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
