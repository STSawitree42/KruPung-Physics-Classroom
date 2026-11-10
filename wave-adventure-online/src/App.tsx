/* App shell: header, connection status, routing */
import { useEffect } from 'react';
import { Home as HomeIcon, GraduationCap, WifiOff } from 'lucide-react';
import { ToastProvider, WaveBackground, go, useHashRoute } from './components/ui';
import { useConnected } from './hooks/useFirebase';
import { isConfigured } from './config/firebase';
import { Splash, Home, CreateRoom, JoinRoom, HowToPlay, Knowledge, SettingsPage } from './pages/Home';
import RoomPage from './pages/Room';
import TeacherDashboard from './pages/Teacher';
import BoardEditor from './pages/BoardEditor';
import { getPrefs, setPrefs } from './game/sound';

function Header() {
  return (
    <header className="sticky top-0 z-40 bg-space/80 backdrop-blur border-b border-neon/20">
      <div className="max-w-7xl mx-auto flex items-center gap-2 px-3 sm:px-5 h-14">
        <button className="flex items-center gap-2 mr-auto" onClick={() => go('/home')} aria-label="หน้าแรก">
          <img src="/assets/icons/icon-192.png" alt="" className="w-8 h-8 rounded-lg" />
          <span className="font-display text-sm sm:text-base tracking-wider"><span className="text-white">WAVE</span><span className="neon-text"> ADVENTURE</span></span>
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => go('/home')}><HomeIcon size={16} /><span className="hidden sm:inline">หน้าแรก</span></button>
        <button className="btn btn-ghost btn-sm" onClick={() => go('/teacher')}><GraduationCap size={16} /><span className="hidden sm:inline">ครู</span></button>
      </div>
    </header>
  );
}

function OfflineBanner() {
  const ok = useConnected();
  if (ok || !isConfigured) return null;
  return <div role="status" className="sticky top-14 z-40 bg-bad/90 text-white text-center text-sm py-2 flex items-center justify-center gap-2"><WifiOff size={16} />ขาดการเชื่อมต่อ — การกระทำในเกมจะยังไม่ถูกส่งจนกว่าจะออนไลน์อีกครั้ง</div>;
}

export default function App() {
  const { path, params } = useHashRoute();
  useEffect(() => { setPrefs(getPrefs()); }, []);
  const seg = path.split('/').filter(Boolean);
  let page;
  switch (seg[0]) {
    case undefined: page = <Splash />; break;
    case 'home': page = <Home />; break;
    case 'create': page = <CreateRoom />; break;
    case 'join': page = <JoinRoom initialCode={params.get('code') || ''} />; break;
    case 'room': page = <RoomPage key={seg[1]} roomId={seg[1]} />; break;
    case 'host': page = <RoomPage key={seg[1]} roomId={seg[1]} asHost />; break;
    case 'teacher': page = <TeacherDashboard />; break;
    case 'editor': page = <BoardEditor />; break;
    case 'how': page = <HowToPlay />; break;
    case 'learn': page = <Knowledge />; break;
    case 'settings': page = <SettingsPage />; break;
    default: page = <Home />;
  }
  return (
    <ToastProvider>
      <WaveBackground />
      <div className="relative z-10 min-h-dvh flex flex-col">
        <Header />
        <OfflineBanner />
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-5 py-4 sm:py-6">{page}</main>
        <footer className="text-center text-xs text-soft py-4 px-4">WAVE ADVENTURE ONLINE · ออกแบบบอร์ดเกมโดย ครูสาวิตรี ทีฆะภรณ์ · โรงเรียนยิ่งยวดพิทยานุกูล สพม.อุดรธานี</footer>
      </div>
    </ToastProvider>
  );
}
