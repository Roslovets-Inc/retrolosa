import { useEffect, useState, useSyncExternalStore } from "react";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const standalone = window.matchMedia("(display-mode: standalone)");
const fullscreen = window.matchMedia("(display-mode: fullscreen)");
function isInstalled() {
  return (
    standalone.matches ||
    fullscreen.matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function useInstallation() {
  const [installed, setInstalled] = useState(isInstalled);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const ready = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
      setMessage("");
    };
    const complete = () => {
      setInstalled(true);
      setPrompt(null);
    };
    const modeChanged = () => setInstalled(isInstalled());
    window.addEventListener("beforeinstallprompt", ready);
    window.addEventListener("appinstalled", complete);
    standalone.addEventListener("change", modeChanged);
    fullscreen.addEventListener("change", modeChanged);
    return () => {
      window.removeEventListener("beforeinstallprompt", ready);
      window.removeEventListener("appinstalled", complete);
      standalone.removeEventListener("change", modeChanged);
      fullscreen.removeEventListener("change", modeChanged);
    };
  }, []);
  const install = async () => {
    if (!prompt || busy) return;
    setBusy(true);
    setMessage("");
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setMessage(choice.outcome === "accepted" ? "install.accepted" : "install.dismissed");
    } catch {
      setMessage("install.failed");
    } finally {
      // The browser's installation event can only be used once, including after dismissal.
      setPrompt(null);
      setBusy(false);
    }
  };
  return { installed, canInstall: prompt !== null, busy, message, install };
}

function subscribeConnection(notify: () => void) {
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
  return () => {
    window.removeEventListener("online", notify);
    window.removeEventListener("offline", notify);
  };
}
export function useOnline() {
  return useSyncExternalStore(subscribeConnection, () => navigator.onLine);
}

export function registerAppWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  const register = () => {
    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
        updateViaCache: "none",
      })
      .catch(() => {
        // Installation remains optional when storage or service workers are unavailable.
      });
  };
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}
