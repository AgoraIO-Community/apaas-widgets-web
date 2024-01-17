export const isElectron = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.indexOf(' electron/') > -1) {
    // Electron-specific code
    return true;
  }
  return false;
};
