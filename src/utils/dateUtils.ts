const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toDateKey(date: Date): string {
  return toDateString(date);
}

export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function dateFromKey(key: string): Date {
  return parseDateString(key);
}

export function shiftDate(key: string, amount: number): string {
  const date = parseDateString(key);
  date.setDate(date.getDate() + amount);
  return toDateString(date);
}

export function formatDate(
  dateOrKey: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof dateOrKey === 'string' ? parseDateString(dateOrKey) : dateOrKey;
  return new Intl.DateTimeFormat('id-ID', options ?? { day: 'numeric', month: 'long' }).format(d);
}

export function formatDateIndonesian(dateOrStr: Date | string): string {
  const d = typeof dateOrStr === 'string' ? parseDateString(dateOrStr) : dateOrStr;
  const dayName = DAYS_ID[d.getDay()];
  const dateNum = d.getDate();
  const monthName = MONTHS_ID[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${dateNum} ${monthName} ${year}`;
}

export function formatShortDate(dateOrStr: Date | string): string {
  const d = typeof dateOrStr === 'string' ? parseDateString(dateOrStr) : dateOrStr;
  const dateNum = d.getDate();
  const monthShort = MONTHS_ID[d.getMonth()].substring(0, 3);
  return `${dateNum} ${monthShort}`;
}

export function formatDayShort(dateOrStr: Date | string): string {
  const d = typeof dateOrStr === 'string' ? parseDateString(dateOrStr) : dateOrStr;
  return DAYS_ID[d.getDay()].substring(0, 3);
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function daysBetween(dateStr1: string, dateStr2: string): number {
  const d1 = parseDateString(dateStr1);
  const d2 = parseDateString(dateStr2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function getYesterdayString(dateStr: string): string {
  return shiftDate(dateStr, -1);
}

export function getTomorrowString(dateStr: string): string {
  return shiftDate(dateStr, 1);
}

export function getLastNDays(endDateStr: string, n: number = 7): string[] {
  const list: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    list.push(shiftDate(endDateStr, -i));
  }
  return list;
}

export function getStatus(total: number, limit: number) {
  if (total < 10) {
    return {
      key: 'low' as const,
      color: '#FFF3B0',
      label: 'Belum cukup',
      title: 'Tidak Cukup Gula',
      message: 'Tubuh butuh energi harian.',
    };
  }
  if (total <= limit) {
    return {
      key: 'optimal' as const,
      color: '#B8F2E6',
      label: 'Cukup',
      title: 'Gula Cukup',
      message: 'Masih dalam batas wajar.',
    };
  }
  return {
    key: 'high' as const,
    color: '#FFAAA5',
    label: 'Berlebih',
    title: 'Gula Berlebih',
    message: 'Sudah melewati batas rekomendasi.',
  };
}
