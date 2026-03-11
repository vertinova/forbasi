import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCheck, FiX, FiDownload, FiFileText } from 'react-icons/fi';

export default function KtaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, action: '', status: '' });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    api.get(`/kta/applications/${id}`).then(r => setApp(r.data.data)).catch(() => toast.error('Data tidak ditemukan')).finally(() => setLoading(false));
  }, [id]);

  const handleUpdateStatus = async (status) => {
    try {
      const payload = { status };
      if (['rejected_pengcab', 'rejected_pengda', 'rejected_pb'].includes(status)) {
        payload.rejection_reason = rejectReason;
      }
      await api.patch(`/kta/applications/${id}/status`, payload);
      toast.success('Status berhasil diperbarui');
      setModal({ open: false, action: '', status: '' });
      const res = await api.get(`/kta/applications/${id}`);
      setApp(res.data.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { cls: 'badge-warning', label: 'Pending' },
      approved_pengcab: { cls: 'badge-info', label: 'Approved Pengcab' },
      approved_pengda: { cls: 'badge-info', label: 'Approved Pengda' },
      approved_pb: { cls: 'badge-success', label: 'Approved PB' },
      kta_issued: { cls: 'badge-success', label: 'KTA Terbit' },
      rejected_pengcab: { cls: 'badge-danger', label: 'Ditolak Pengcab' },
      rejected_pengda: { cls: 'badge-danger', label: 'Ditolak Pengda' },
      rejected_pb: { cls: 'badge-danger', label: 'Ditolak PB' },
      rejected: { cls: 'badge-danger', label: 'Ditolak' },
      resubmit_to_pengda: { cls: 'badge-warning', label: 'Diajukan Ulang ke Pengda' },
      pending_pengda_resubmit: { cls: 'badge-warning', label: 'Re-review Pengda' },
    };
    const s = map[status] || { cls: '', label: status };
    return <span className={`badge ${s.cls}`}>{s.label}</span>;
  };

  const canApprove = () => {
    if (!app || !user) return false;
    const roleId = user.role_id;
    if (roleId === 2 && ['pending', 'rejected_pengda', 'rejected_pb'].includes(app.status)) return true;
    if (roleId === 3 && ['approved_pengcab', 'resubmit_to_pengda', 'rejected_pb', 'pending_pengda_resubmit'].includes(app.status)) return true;
    if (roleId === 4 && ['approved_pengda', 'pending_pengda_resubmit', 'rejected_pb'].includes(app.status)) return true;
    return false;
  };

  const canResubmitToPengda = () => {
    return user?.role_id === 2 && (app?.status === 'rejected_pengda' || app?.status === 'rejected_pb');
  };

  const canIssueKta = () => user?.role_id === 4 && app?.status === 'approved_pb';

  const getApproveStatus = () => {
    const roleId = user?.role_id;
    if (roleId === 2) return 'approved_pengcab';
    if (roleId === 3) return 'approved_pengda';
    if (roleId === 4) return 'approved_pb';
    return '';
  };

  const getRejectStatus = () => {
    const roleId = user?.role_id;
    if (roleId === 2) return 'rejected_pengcab';
    if (roleId === 3) return 'rejected_pengda';
    if (roleId === 4) return 'rejected_pb';
    return 'rejected';
  };

  if (loading) return <><Navbar title="Detail KTA" /><LoadingSpinner /></>;
  if (!app) return <><Navbar title="Detail KTA" /><div className="page-container"><p>Data tidak ditemukan</p></div></>;

  return (
    <div style={{ minHeight: '100vh', background: '#f1faee' }}>
      <Navbar title="Detail Pengajuan KTA" />
      <div className="page-container" style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
          <FiArrowLeft /> Kembali
        </button>

        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.1rem' }}>{app.club_name}</h3>
            {getStatusBadge(app.status)}
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><strong>Provinsi:</strong><br />{app.province_name || '-'}</div>
              <div><strong>Kota/Kabupaten:</strong><br />{app.city_name || '-'}</div>
              <div><strong>Ketua:</strong><br />{app.leader_name || '-'}</div>
              <div><strong>Pelatih:</strong><br />{app.coach_name || '-'}</div>
              <div><strong>Manajer:</strong><br />{app.manager_name || '-'}</div>
              <div><strong>Nama Sekolah:</strong><br />{app.school_name || '-'}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Alamat:</strong><br />{app.club_address || '-'}</div>
              <div><strong>Tanggal Pengajuan:</strong><br />{new Date(app.created_at).toLocaleDateString('id-ID')}</div>
              <div><strong>Nominal Bayar:</strong><br />{app.nominal_paid ? `Rp ${Number(app.nominal_paid).toLocaleString('id-ID')}` : '-'}</div>
              {app.kta_barcode_unique_id && <div><strong>Barcode ID:</strong><br />{app.kta_barcode_unique_id}</div>}
            </div>

            {/* Documents */}
            <h4 style={{ fontSize: '1rem', marginTop: '1.5rem' }}>Dokumen</h4>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {app.sk_file_path && (
                <a href={`${import.meta.env.VITE_API_URL}/uploads/${app.sk_file_path}`} target="_blank" rel="noreferrer" className="btn btn-secondary">
                  <FiFileText /> SK Pendirian
                </a>
              )}
              {app.logo_path && (
                <a href={`${import.meta.env.VITE_API_URL}/uploads/${app.logo_path}`} target="_blank" rel="noreferrer" className="btn btn-secondary">
                  <FiFileText /> Logo Klub
                </a>
              )}
              {app.payment_proof_path && (
                <a href={`${import.meta.env.VITE_API_URL}/uploads/${app.payment_proof_path}`} target="_blank" rel="noreferrer" className="btn btn-secondary">
                  <FiFileText /> Bukti Pembayaran
                </a>
              )}
              {app.ad_file_path && (
                <a href={`${import.meta.env.VITE_API_URL}/uploads/${app.ad_file_path}`} target="_blank" rel="noreferrer" className="btn btn-secondary">
                  <FiFileText /> AD/ART
                </a>
              )}
            </div>

            {/* KTA PDF */}
            {app.status === 'kta_issued' && (
              <div style={{ marginTop: '1.5rem' }}>
                <button className="btn btn-primary" onClick={async () => {
                  try {
                    const res = await api.get(`/kta/applications/${app.id}/download-pdf`, { responseType: 'blob' });
                    const url = window.URL.createObjectURL(new Blob([res.data]));
                    const a = document.createElement('a'); a.href = url; a.download = `KTA_${app.club_name || app.id}.pdf`; a.click();
                  } catch { toast.error('Gagal download PDF'); }
                }}>
                  <FiDownload /> Download KTA PDF
                </button>
              </div>
            )}

            {/* Reject reason */}
            {['rejected', 'rejected_pengcab', 'rejected_pengda', 'rejected_pb'].includes(app.status) && app.rejection_reason && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#ffebee', borderRadius: 8, color: '#c62828' }}>
                <strong>Alasan Penolakan:</strong><br />{app.rejection_reason}
              </div>
            )}

            {/* Action Buttons */}
            {(canApprove() || canIssueKta() || canResubmitToPengda()) && (
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {canApprove() && (
                  <>
                    <button className="btn btn-primary" onClick={() => setModal({ open: true, action: 'approve', status: getApproveStatus() })}>
                      <FiCheck /> Approve
                    </button>
                    <button className="btn btn-danger" onClick={() => setModal({ open: true, action: 'reject', status: getRejectStatus() })}>
                      <FiX /> Reject
                    </button>
                  </>
                )}
                {canResubmitToPengda() && (
                  <button className="btn btn-warning" onClick={() => setModal({ open: true, action: 'approve', status: 'resubmit_to_pengda' })}>
                    <FiCheck /> Ajukan Ulang ke Pengda
                  </button>
                )}
                {canIssueKta() && (
                  <button className="btn btn-primary" onClick={() => setModal({ open: true, action: 'issue', status: 'kta_issued' })}>
                    <FiCheck /> Terbitkan KTA
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Activity Logs */}
        {app.activity_logs?.length > 0 && (
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Riwayat Aktivitas</h3></div>
            <div className="table-responsive">
              <table>
                <thead><tr><th>Waktu</th><th>Aksi</th><th>Oleh</th><th>Catatan</th></tr></thead>
                <tbody>
                  {app.activity_logs.map((log, i) => (
                    <tr key={i}>
                      <td>{new Date(log.created_at).toLocaleString('id-ID')}</td>
                      <td>{log.action}</td>
                      <td>{log.performed_by || '-'}</td>
                      <td>{log.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Confirm/Reject Modal */}
        {modal.open && modal.action === 'reject' ? (
          <div className="modal-overlay" onClick={() => setModal({ open: false, action: '', status: '' })}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Tolak Pengajuan</h3>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Alasan Penolakan</label>
                <textarea className="form-control" value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button className="btn btn-danger" onClick={() => handleUpdateStatus(modal.status)}>Tolak</button>
                <button className="btn btn-secondary" onClick={() => setModal({ open: false, action: '', status: '' })}>Batal</button>
              </div>
            </div>
          </div>
        ) : modal.open ? (
          <ConfirmModal
            title={modal.action === 'issue' ? 'Terbitkan KTA?' : 'Approve Pengajuan?'}
            message={modal.action === 'issue' ? 'KTA akan diterbitkan untuk klub ini.' : 'Pengajuan akan di-approve.'}
            onConfirm={() => handleUpdateStatus(modal.status)}
            onCancel={() => setModal({ open: false, action: '', status: '' })}
          />
        ) : null}
      </div>
    </div>
  );
}
