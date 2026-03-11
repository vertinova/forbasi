import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function ApprovedTeams() {
  const [teams, setTeams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ category_id: '', region: '', search: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTeams(); }, [filters.category_id, filters.region]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.region) params.region = filters.region;
      if (filters.search) params.search = filters.search;
      const { data } = await api.get('/public/approved-teams', { params });
      setTeams(data.data.teams || []);
      setCategories(data.data.categories || []);
    } catch {
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTeams();
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <h1 style={{ textAlign: 'center', marginBottom: 8 }}>Tim Kejurnas yang Disetujui</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: 24 }}>
        Daftar tim yang telah disetujui untuk mengikuti Kejurnas FORBASI
      </p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Cari nama klub..."
          value={filters.search}
          onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6 }}
        />
        <select
          value={filters.category_id}
          onChange={e => setFilters(p => ({ ...p, category_id: e.target.value }))}
          style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6 }}
        >
          <option value="">Semua Kategori</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
        </select>
        <select
          value={filters.region}
          onChange={e => setFilters(p => ({ ...p, region: e.target.value }))}
          style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6 }}
        >
          <option value="">Semua Region</option>
          <option value="Jawa">Jawa</option>
          <option value="Luar Jawa">Luar Jawa</option>
        </select>
        <button type="submit" style={{ padding: '8px 20px', background: '#1d3557', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Cari
        </button>
      </form>

      {loading ? (
        <p style={{ textAlign: 'center' }}>Memuat data...</p>
      ) : teams.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#999' }}>Belum ada tim yang disetujui</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1d3557', color: '#fff' }}>
                <th style={thStyle}>No</th>
                <th style={thStyle}>Nama Klub</th>
                <th style={thStyle}>Kategori</th>
                <th style={thStyle}>Pelatih</th>
                <th style={thStyle}>Manajer</th>
                <th style={thStyle}>Provinsi</th>
                <th style={thStyle}>Region</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, idx) => (
                <tr key={team.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{idx + 1}</td>
                  <td style={tdStyle}>{team.club_name}</td>
                  <td style={tdStyle}>{team.category_name}</td>
                  <td style={tdStyle}>{team.coach_name || '-'}</td>
                  <td style={tdStyle}>{team.manager_name || '-'}</td>
                  <td style={tdStyle}>{team.province_name || '-'}</td>
                  <td style={tdStyle}>{team.region || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: 14 };
const tdStyle = { padding: '8px 12px', fontSize: 14 };
