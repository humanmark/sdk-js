export interface DeviceInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  userAgent: string;
}

export function detectDevice(): DeviceInfo {
  const userAgent = navigator.userAgent || '';

  // Primary detection via UserAgent (still the most reliable method)
  const uaIsMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    );

  // Secondary detection via touch support and screen size
  const hasTouchSupport =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

  // Check for mobile viewport characteristics
  const hasSmallViewport =
    window.innerWidth <= 768 && window.innerHeight <= 1024;

  // Combine signals - require at least two indicators for mobile
  const isMobile = uaIsMobile || (hasTouchSupport && hasSmallViewport);

  // Check for iOS - exclude IE11 which has MSStream
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !('MSStream' in window);
  const isAndroid = /Android/.test(userAgent);

  return {
    isMobile,
    isIOS,
    isAndroid,
    userAgent,
  };
}

export function shouldShowQRCode(): boolean {
  const device = detectDevice();
  return !device.isMobile;
}

export function shouldShowDeepLink(): boolean {
  const device = detectDevice();
  return device.isMobile;
}

export function isMobileDevice(): boolean {
  const device = detectDevice();
  return device.isMobile;
}
