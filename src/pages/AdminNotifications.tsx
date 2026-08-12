import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Send, Search } from 'lucide-react';

export default function AdminNotifications() {
  const { announcements, sendAnnouncement } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showComposeModal, setShowComposeModal] = useState(false);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<'All Users' | 'Customers Only' | 'Admins Only' | 'Active Auction Bidders'>('All Users');
  const [type, setType] = useState<'System Alert' | 'Promotion' | 'Platform Update' | 'Maintenance Notice'>('Platform Update');

  function handleComposeSubmit() {
    if (!title.trim() || !message.trim()) return;
    sendAnnouncement({
      title,
      message,
      audience,
      type,
    });
    setTitle('');
    setMessage('');
    setShowComposeModal(false);
  }

  const filtered = announcements.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-400" /> Notifications & Announcements
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Broadcast targeted platform announcements, maintenance warnings, and bidding event alerts.
          </p>
        </div>

        <button
          onClick={() => setShowComposeModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-900/40 transition-all"
        >
          <Send className="w-4 h-4" /> Compose Announcement
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search sent announcements..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Total Broadcasts: <strong className="text-white">{announcements.length}</strong>
        </span>
      </div>

      {/* Sent Announcements Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Announcement Details</th>
                <th className="p-4">Type</th>
                <th className="p-4">Target Audience</th>
                <th className="p-4">Dispatched By</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-white text-xs">{a.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 max-w-md">{a.message}</p>
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-800 text-purple-300 border border-slate-700 px-2.5 py-1 rounded-md text-[11px] font-semibold">
                      {a.type}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="bg-blue-500/10 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[11px] font-medium">
                      {a.audience} ({a.deliveredCount} users)
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-slate-200">{a.sentBy}</td>
                  <td className="p-4 font-mono text-[11px] text-slate-400">
                    {new Date(a.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPOSE MODAL */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-400" /> Compose System Announcement
              </h3>
              <button onClick={() => setShowComposeModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Scheduled System Optimization"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Audience</label>
                  <select
                    value={audience}
                    onChange={e => setAudience(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="All Users">All Users</option>
                    <option value="Customers Only">Customers Only</option>
                    <option value="Admins Only">Admins Only</option>
                    <option value="Active Auction Bidders">Active Auction Bidders</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Notification Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Platform Update">Platform Update</option>
                    <option value="System Alert">System Alert</option>
                    <option value="Promotion">Promotion</option>
                    <option value="Maintenance Notice">Maintenance Notice</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Message Body</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Write announcement body..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                onClick={() => setShowComposeModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleComposeSubmit}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg font-semibold shadow-lg shadow-purple-900/40"
              >
                Dispatch Announcement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
