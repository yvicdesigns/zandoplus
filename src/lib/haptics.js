import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// No-op silencieux sur le web — Haptics n'existe que sur iOS/Android natif.
const isNative = () => Capacitor.isNativePlatform();

export const hapticLight = () => {
  if (isNative()) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
};

export const hapticMedium = () => {
  if (isNative()) Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
};

export const hapticSuccess = () => {
  if (isNative()) Haptics.notification({ type: NotificationType.Success }).catch(() => {});
};
