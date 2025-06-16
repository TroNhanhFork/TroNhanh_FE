import { logout } from './authService';

let logoutTimer;
const TIMEOUT = 60* 30 * 1000;

const resetTimer = () => {
  console.log('🕐 Reset timer do user activity');
  clearTimeout(logoutTimer);
  logoutTimer = setTimeout(() => {
    console.log('😴 Không hoạt động → auto logout');
    logout('idle timeout');
  }, TIMEOUT);
};


export const initAutoLogout = () => {
  ['click', 'mousemove', 'keydown', 'scroll'].forEach((event) => {
    window.addEventListener(event, resetTimer);
  });
  resetTimer();
};

export const stopAutoLogout = () => {
  ['click', 'mousemove', 'keydown', 'scroll'].forEach((event) => {
    window.removeEventListener(event, resetTimer);
  });
  clearTimeout(logoutTimer);
};
