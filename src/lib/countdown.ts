export function birthdayCountdown(date: string, now = new Date()) {
  const [, m, d] = date.split("-").map(Number);
  if (!m || !d)
    return { today: false, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const targetFor = (year: number) =>
    new Date(year, m - 1, Math.min(d, new Date(year, m, 0).getDate()));
  let target = targetFor(now.getFullYear());
  const today =
    target.getMonth() === now.getMonth() && target.getDate() === now.getDate();
  if (!today && target.getTime() < now.getTime())
    target = targetFor(now.getFullYear() + 1);
  const seconds = today
    ? 0
    : Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  return {
    today,
    days: Math.floor(seconds / 86400),
    hours: Math.floor(seconds / 3600) % 24,
    minutes: Math.floor(seconds / 60) % 60,
    seconds: seconds % 60,
  };
}
