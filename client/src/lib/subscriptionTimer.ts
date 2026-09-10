export interface SubscriptionRemainingTime {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  shortText: string;
  badgeText: string;
  clockText: string;
}

/**
 * Calculates remaining active subscription time in days, hours, minutes, and seconds.
 * Correctly accounts for stacked recharges (e.g. 1 day + 7 days = 8 days).
 */
export const getSubscriptionRemainingTime = (
  expiresAtStr: string | null | undefined
): SubscriptionRemainingTime => {
  if (!expiresAtStr) {
    return {
      totalSeconds: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: false,
      shortText: 'Active',
      badgeText: 'Active',
      clockText: '00d : 00h : 00m : 00s',
    };
  }

  const expiryMs = new Date(expiresAtStr).getTime();
  const nowMs = Date.now();
  const diffMs = expiryMs - nowMs;

  if (diffMs <= 0 || isNaN(diffMs)) {
    return {
      totalSeconds: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      shortText: 'Expired',
      badgeText: 'Expired',
      clockText: '00d : 00h : 00m : 00s',
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  let shortText = '';
  if (days > 0) {
    shortText = `${days}d ${hours}h left`;
  } else if (hours > 0) {
    shortText = `${hours}h ${minutes}m left`;
  } else {
    shortText = `${minutes}m ${seconds}s left`;
  }

  let badgeText = '';
  if (days > 0) {
    badgeText = `${days} Day${days > 1 ? 's' : ''} ${hours}h ${minutes}m left`;
  } else if (hours > 0) {
    badgeText = `${hours}h ${minutes}m ${seconds}s left`;
  } else {
    badgeText = `${minutes}m ${seconds}s left`;
  }

  const clockText = `${pad(days)}d : ${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;

  return {
    totalSeconds,
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    shortText,
    badgeText,
    clockText,
  };
};
