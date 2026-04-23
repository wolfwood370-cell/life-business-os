import { useEffect, useState, ReactNode } from 'react';
import { PrivacyModeContext } from './privacyModeContext';

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
