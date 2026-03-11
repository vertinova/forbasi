import { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ConfirmModal from '../../components/common/ConfirmModal';
import toast from 'react-hot-toast';

export default function ManageReregistration() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState({ show: false, id: null, action: '' });

  useEffect(() => { loadData(); }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await api.get(`/config/reregistrations${params}`);
      setItems(res.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  const handleAction = async () => {
    try {
      await api.put(`/config/reregistrations/${modal.id}/status`, { status: modal.action });
      toast.success(`Pendaftaran ${modal.action === 'approved' ? 'disetujui' : 'ditolak'}`);
      setModal({ show: false, id: null, action: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memproses');
    }
  };

  const statusBadge = (status) => {
    const colors = { pending: '#f0ad4e', approved: '#0d9500', rejected: '#dc3545' };
    return <span style={{ backgroundColor: colors[status] || '#666', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{status}</span>;
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h2>Kelola Pendaftaran Ulang</h2>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
          <option value="all">Semua</option>
          <option value="pending">Pending</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
        </select>
      </div>

      <div className="card">
        {loading ? <p>Memuat...</p> : items.length === 0 ? <p>Tidak ada data.</p> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Klub</th>
                <th>Kompetisi</th>
                <th>Tahun</th>
                <th>Status</th>
                <th>Dokumen</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td>{item.club_name || '-'}</td>
                  <td>{item.competition_name}</td>
                  <td>{item.year}</td>
                  <td>{statusBadge(item.status)}</td>
                  <td>
                    {item.document_path ? (
                      <a href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${item.document_path}`} target="_blank" rel="noopener noreferrer">Lihat</a>
                    ) : '-'}
                  </td>
                  <td>
                    {item.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-success btn-sm" onClick={() => setModal({ show: true, id: item.id, action: 'approved' })}>Setujui</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setModal({ show: true, id: item.id, action: 'rejected' })}>Tolak</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal.show && (
        <ConfirmModal
          title={modal.action === 'approved' ? 'Setujui Pendaftaran?' : 'Tolak Pendaftaran?'}
          message={`Yakin ingin ${modal.action === 'approved' ? 'menyetujui' : 'menolak'} pendaftaran ini?`}
          onConfirm={handleAction}
          onCancel={() => setModal({ show: false, id: null, action: '' })}
        />
      )}
    </DashboardLayout>
  );
}
