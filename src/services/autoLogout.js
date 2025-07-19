let logoutTimer;
let resetTimer;

export function initAutoLogout(logout, delay = 15 * 60 * 1000) {
  clearTimeout(logoutTimer);

  resetTimer = () => {
    clearTimeout(logoutTimer);
    logoutTimer = setTimeout(() => {
      console.log("Logged out by inactivity")
      logout();
    }, delay);
  };

  const events = ['click', 'mousemove', 'keydown', 'scroll'];
  for (const event of events) {
    window.addEventListener(event, resetTimer);
  }

  resetTimer(); // Start timer ngay từ đầu
}

export function stopAutoLogout() {
  clearTimeout(logoutTimer);
  const events = ['click', 'mousemove', 'keydown', 'scroll'];
  if (resetTimer) {
    for (const event of events) {
      window.removeEventListener(event, resetTimer);
    }
  }
}
