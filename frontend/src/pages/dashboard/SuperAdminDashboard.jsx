import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/layout/SidebarLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [targetType, setTargetType] = useState('all');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get('/notifications/stats')
      .then(r => setStats(r.data.data))
      .catch(() => toast.error('Gagal memuat data'))
      .finally(() => setLoading(false));
  }, []);

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return toast.error('Judul dan isi wajib diisi');
    setSending(true);
    try {
      const res = await api.post('/notifications/send', {
        title, body, url: url || undefined, target_type: targetType
      });
      toast.success(`Notifikasi terkirim ke ${res.data.data.successful} subscriber`);
      setTitle(''); setBody(''); setUrl('');
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal mengirim'); }
    finally { setSending(false); }
  };

  const menuItems = [
    { to: '/superadmin', icon: <i className="fas fa-tachometer-alt" />, label: 'Dashboard' },
  ];

  if (loading) return (
    <SidebarLayout menuItems={menuItems} title="SuperAdmin Dashboard">
      <LoadingSpinner />
    </SidebarLayout>
  );

  return (
    <SidebarLayout menuItems={menuItems} title="SuperAdmin Dashboard" subtitle="FORBASI">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total Subscribers', value: stats.subscriptions?.total || 0, bg: 'bg-blue-50', text: 'text-blue-700', icon: 'fa-users' },
            { label: 'Anggota', value: stats.subscriptions?.users || 0, bg: 'bg-green-50', text: 'text-green-700', icon: 'fa-user' },
            { label: 'Pengcab', value: stats.subscriptions?.pengcab || 0, bg: 'bg-red-50', text: 'text-red-700', icon: 'fa-building' },
            { label: 'Pengda', value: stats.subscriptions?.pengda || 0, bg: 'bg-purple-50', text: 'text-purple-700', icon: 'fa-map-marker' },
            { label: 'Log Terakhir', value: stats.recentLogs?.length || 0, bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'fa-paper-plane' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}>
              <i className={`fas ${s.icon} text-2xl ${s.text}`} />
              <div>
                <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Send Notification */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="bg-[#1d3557] px-5 py-3">
          <h2 className="text-sm font-semibold text-white m-0">
            <i className="fas fa-bell mr-2" />Kirim Push Notification
          </h2>
        </div>
        <div className="p-5">
          <form onSubmit={handleSendNotification} className="max-w-xl space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1d3557] mb-1.5">Judul *</label>
              <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#28a745]"
                value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1d3557] mb-1.5">Isi Pesan *</label>
              <textarea className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#28a745] resize-y min-h-20"
                value={body} onChange={e => setBody(e.target.value)} rows={3} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1d3557] mb-1.5">URL Tujuan (opsional)</label>
              <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#28a745]"
                value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1d3557] mb-1.5">Target Penerima</label>
              <select className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#28a745] bg-white"
                value={targetType} onChange={e => setTargetType(e.target.value)}>
                <option value="all">Semua ({stats?.subscriptions?.total || 0})</option>
                <option value="user">Anggota ({stats?.subscriptions?.users || 0})</option>
                <option value="pengcab">Pengcab ({stats?.subscriptions?.pengcab || 0})</option>
                <option value="pengda">Pengda ({stats?.subscriptions?.pengda || 0})</option>
                <option value="pb">PB ({stats?.subscriptions?.pb || 0})</option>
              </select>
            </div>
            <button type="submit" disabled={sending}
              className="px-6 py-2.5 bg-[#28a745] hover:bg-[#1e7e34] text-white text-sm font-semibold rounded-lg border-none cursor-pointer font-[Poppins] transition-colors disabled:opacity-60">
              {sending ? 'Mengirim...' : <><i className="fas fa-paper-plane mr-2" />Kirim Notifikasi</>}
            </button>
          </form>
        </div>
      </div>

      {/* Recent Logs */}
      {stats?.recentLogs?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-[#1d3557] px-5 py-3">
            <h2 className="text-sm font-semibold text-white m-0">
              <i className="fas fa-history mr-2" />Log Notifikasi Terakhir
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <th className="px-4 py-3">Judul</th>
                  <th className="px-4 py-3">Isi</th>
                  <th className="px-4 py-3">Terkirim</th>
                  <th className="px-4 py-3">Gagal</th>
                  <th className="px-4 py-3">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentLogs.map((log, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-sm text-gray-800">{log.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{log.body}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {log.successful}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {log.failed}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}


