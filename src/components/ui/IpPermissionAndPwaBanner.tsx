// src/components/ui/IpPermissionAndPwaBanner.tsx
import React, { useState, useEffect } from 'react';
import { Camera, MapPin, Download, X, Copy, Check, ShieldCheck, AlertCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const IpPermissionAndPwaBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIpHost, setIsIpHost] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'prompt' | 'denied' | 'insecure'>('prompt');
  const [locationPermission, setLocationPermission] = useState<'granted' | 'prompt' | 'denied'>('prompt');
  const [copied, setCopied] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if dismissed in this session
    if (sessionStorage.getItem('c3s_perm_banner_dismissed') === '1') {
      setIsDismissed(true);
    }

    // Check if running on IP address (e.g. 192.168.x.x, 10.x.x.x)
    const hostname = window.location.hostname;
    const isIp = /^(\d+\.\d+\.\d+\.\d+)$/.test(hostname) || hostname.includes('192.168.') || hostname.includes('10.');
    setIsIpHost(isIp);

    // Check if already in standalone PWA mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setIsInstalled(true);
    }

    // Capture PWA install event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check existing permissions if browser permissions API exists
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((status) => {
        setLocationPermission(status.state);
        status.onchange = () => setLocationPermission(status.state);
      }).catch(() => {});

      navigator.permissions.query({ name: 'camera' as any }).then((status) => {
        setCameraPermission(status.state);
        status.onchange = () => setCameraPermission(status.state);
      }).catch(() => {
        // In plain HTTP over IP, camera permission query can reject
        if (window.location.protocol === 'http:' && isIp) {
          setCameraPermission('insecure');
        }
      });
    } else if (window.location.protocol === 'http:' && isIp) {
      setCameraPermission('insecure');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleRequestPermissions = async () => {
    // 1. Request Geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setLocationPermission('granted'),
        () => setLocationPermission('denied'),
        { timeout: 5000, enableHighAccuracy: true }
      );
    }

    // 2. Request Camera (rear environment camera only)
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        });
        stream.getTracks().forEach((track) => track.stop());
        setCameraPermission('granted');
      } catch {
        setCameraPermission('denied');
      }
    } else {
      // Insecure context restriction on HTTP IP
      setShowHelpModal(true);
    }
  };

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      setShowHelpModal(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('c3s_perm_banner_dismissed', '1');
  };

  const copyOriginFlag = () => {
    const origin = window.location.origin;
    navigator.clipboard.writeText(origin).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Only show banner if running on IP address or PWA install is available
  if (isDismissed || isInstalled || (!isIpHost && !deferredPrompt)) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-20 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 z-40 max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 rounded-2xl p-3.5 shadow-2xl animate-in slide-in-from-bottom duration-300 select-none">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                {isIpHost ? 'Campus IP Device Setup' : 'Install C3S App'}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {isIpHost ? 'Allow rear camera & GPS for seamless safe navigation' : 'Install as full-screen PWA on your home screen'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          {/* Permission Request CTA */}
          <button
            type="button"
            onClick={handleRequestPermissions}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800/60 transition-all cursor-pointer active:scale-95"
          >
            <Camera className="w-3.5 h-3.5" />
            <MapPin className="w-3 h-3 -ml-0.5" />
            <span>Grant Access</span>
          </button>

          {/* Download as PWA CTA */}
          <button
            type="button"
            onClick={handleInstallPwa}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PWA</span>
          </button>
        </div>
      </div>

      {/* IP & PWA Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  IP Hosting & PWA Download
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/5 space-y-1.5">
                <p className="font-bold text-slate-900 dark:text-white">
                  📲 Download / Install as App:
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  On Chrome/Edge: Tap <strong>⋮ (Menu)</strong> ➔ <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  On iOS Safari: Tap <strong>Share (📤)</strong> ➔ <strong>"Add to Home Screen"</strong>.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 space-y-2">
                <p className="font-bold text-amber-900 dark:text-amber-300">
                  🔒 Rear Camera on IP (http://192.168.x.x):
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-400">
                  Browsers protect the camera over unencrypted HTTP. To enable camera on this IP address:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-amber-800 dark:text-amber-400">
                  <li>In Chrome address bar, open: <code className="bg-amber-100 dark:bg-amber-900/60 px-1 rounded font-mono">chrome://flags/#unsafely-treat-insecure-origin-as-secure</code></li>
                  <li>Paste this site's URL and click <strong>Enabled</strong>.</li>
                  <li>Relaunch Chrome.</li>
                </ol>

                <button
                  type="button"
                  onClick={copyOriginFlag}
                  className="w-full mt-2 py-1.5 px-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied Site Origin!' : 'Copy Site Origin to Clipboard'}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs cursor-pointer shadow-md shadow-blue-500/20"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
