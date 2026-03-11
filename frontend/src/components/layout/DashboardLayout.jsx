import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function DashboardLayout({ title, backTo }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title={title} backTo={backTo} />
      <main className="max-w-[1400px] mx-auto px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
