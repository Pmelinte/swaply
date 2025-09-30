export type Locale = 'ro' | 'en';

const LOCALE_COOKIE_NAME = 'locale';

export function getLocale(): Locale {
  if (typeof document === 'undefined') {
    return 'ro';
  }

  const cookies = document.cookie.split('; ');
  const localeCookie = cookies.find(c => c.startsWith(`${LOCALE_COOKIE_NAME}=`));
  
  if (localeCookie) {
    const value = localeCookie.split('=')[1] as Locale;
    if (value === 'ro' || value === 'en') {
      return value;
    }
  }
  
  return 'ro';
}

export function setLocaleCookie(locale: Locale): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}
