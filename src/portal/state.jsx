import Words from "./Words"; /* eslint-disable react-refresh/only-export-components -- Context provider and hooks share one module. */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { backend, problem } from './client';

const PortalContext = createContext(null);
const storageRead = (key, fallback) => {try {return JSON.parse(sessionStorage.getItem(key)) ?? fallback;} catch {return fallback;}};
const remembered = (key) => {try {return localStorage.getItem(key);} catch {return null;}};
export function PortalProvider({ children }) {
  const [session, setSession] = useState(() => storageRead('expo-account', null));
  const [language, setLanguage] = useState(() => remembered('expo-language') || 'ar');
  const [theme, setTheme] = useState(() => remembered('expo-theme') || 'system');
  const [resolvedTheme,setResolvedTheme] = useState('light');
  const [toast, setToast] = useState(null);
  const [account, setAccount] = useState(null);
  const toastTimer = useRef(null);
  const notify = useCallback((message, tone = 'success') => {clearTimeout(toastTimer.current);setToast({ message, tone });toastTimer.current = setTimeout(() => setToast(null), 6500);}, []);
  const login = useCallback((data) => {
    const clean = { id: data.id, role: data.role, status: data.status };
    setSession(clean);sessionStorage.setItem('expo-account', JSON.stringify(clean));
  }, []);
  const logout = useCallback(() => {void backend.post('/auth/logout').catch(() => {});setSession(null);setAccount(null);sessionStorage.removeItem('expo-account');location.hash = 'home';}, []);
  const refreshAccount = useCallback(async () => {
    if (!session?.id) return null;
    const data = session.role === 'SELLER' ? (await backend.sellers()).find((s) => s.id === session.id) : await backend.account(session.id);
    setAccount(data);return data;
  }, [session]);
  useEffect(() => {
    let alive = true;
    if (session?.id) {
      const load = session.role === 'SELLER' ? backend.sellers().then((xs) => xs.find((x) => x.id === session.id)) : backend.account(session.id);
      load.then((data) => {if (alive) setAccount(data);}).catch(() => {if (alive) setAccount(null);});
    }
    return () => {alive = false;};
  }, [session]);
  useEffect(() => {
    const match = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {const resolved = theme === 'system' ? (match.matches ? 'dark' : 'light') : theme; document.documentElement.dataset.expoTheme = resolved; setResolvedTheme(resolved);};
    apply();match.addEventListener('change', apply);
    localStorage.setItem('expo-theme', theme);
    return () => match.removeEventListener('change', apply);
  }, [theme]);
  useEffect(() => {document.documentElement.lang = language;localStorage.setItem('expo-language', language);}, [language]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  return <PortalContext.Provider value={{ session, login, logout, account, refreshAccount, language, setLanguage, theme, setTheme, resolvedTheme, notify }}>
    <Words>{children}</Words><Words>{toast && <div className={`portal-toast ${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'}><Words>{toast.message}</Words><button aria-label="إغلاق" onClick={() => setToast(null)}><Words>×</Words></button></div>}</Words>
  </PortalContext.Provider>;
}
export const usePortal = () => useContext(PortalContext);

export function useResource(key, loader) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const loaderRef = useRef(loader);
  useEffect(() => {loaderRef.current = loader;}, [loader]);
  const seq = useRef(0);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    const current = ++seq.current;
    const run = async () => {
      setLoading(true);setError('');
      try {const value = await loaderRef.current();if (current === seq.current) setData(value);}
      catch (e) {if (current === seq.current) setError(problem(e));} finally
      {if (current === seq.current) setLoading(false);}
    };
    void run();
    return () => {if (seq.current === current) seq.current = current + 1;};
  }, [key, version]);
  return { data, loading, error, refresh };
}
export function useMutation() {
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const { notify } = usePortal();
  const run = async (action, after, message = 'تم الحفظ بنجاح') => {
    if (lock.current) return;
    lock.current = true;setBusy(true);
    try {const result = await action();if (after) await after(result);if (message) notify(message);return result;}
    catch (error) {notify(problem(error), 'error');return undefined;} finally
    {lock.current = false;setBusy(false);}
  };
  return { busy, run };
}
