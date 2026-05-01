import { useLocalStorage } from '../useLocalStorage';
import { useEffect } from 'react';

export function useTheme() {
  const [isDark, setIsDark] = useLocalStorage('stepsync-theme-dark', true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return { isDark, toggleTheme };
}
