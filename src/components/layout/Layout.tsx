import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1f1a] flex flex-col">
      <main className="flex-1 overflow-y-auto pb-20 max-w-2xl mx-auto w-full">
        <Outlet />
      </main>
      <NavBar />
    </div>
  );
}
