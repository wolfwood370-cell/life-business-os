import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface PrivacyModeValue {
  privacyMode: boolean;
  togglePrivacyMode: () => void;
  setPrivacyMode: (v: boolean) => void;
}

const PrivacyModeContext = createContext<PrivacyModeValue | null>(null);

const STORAGE_KEY = 'pt_crm_privacy_mode';

export const PrivacyModeProvider = ({ children }: { children: ReactNode }) => {
  const [privacyMode, setPrivacyModeState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === '1';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, privacyMode ? '1' : '0');
    document.documentElement.classList.toggle('privacy-on', privacyMode);
    return () => { document.documentElement.classList.remove('privacy-on'); };
  }, [privacyMode]);

  return (
    <PrivacyModeContext.Provider
      value={{
        privacyMode,
        togglePrivacyMode: () => setPrivacyModeState(v => !v),
        setPrivacyMode: setPrivacyModeState,
      }}
    >
      {children}
    </PrivacyModeContext.Provider>
  );
};

export const usePrivacyMode = () => {
  const ctx = useContext(PrivacyModeContext);
  if (!ctx) throw new Error('usePrivacyMode must be used within PrivacyModeProvider');
  return ctx;
};
