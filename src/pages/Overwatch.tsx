import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { OverwatchTab } from '@/components/tabs/OverwatchTab';

export default function OverwatchPage() {
  const navigate = useNavigate();

  useEffect(() => {
    function onNavigate(e: Event) {
      try {
        const detail = (e as CustomEvent).detail as any;
        if (detail?.tab) navigate('/', { replace: true });
      } catch {}
    }
    window.addEventListener('navigate-tab', onNavigate as any);
    return () => window.removeEventListener('navigate-tab', onNavigate as any);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">OverWatch</h1>
          <Link to="/" className="text-sm underline">
            Back to Estimator
          </Link>
        </div>
        <OverwatchTab />
      </div>
    </div>
  );
}
