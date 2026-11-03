// Persistence boundary. The desktop (Steam) build should swap this for a file in the user data
// directory so Steam Auto-Cloud can sync it.

export const SAVE_KEY = 'mainframe2.save';
export const CORRUPT_SAVE_KEY = 'mainframe2.save.corrupt';

export const storage = {
  read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  write(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },

  remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
};
