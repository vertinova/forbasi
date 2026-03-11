import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function DashboardLayout({ title, backTo }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f1faee' }}>
      <Navbar title={title} backTo={backTo} />
      <div className="page-container">
        <Outlet />
      </div>
    </div>
  );
}
