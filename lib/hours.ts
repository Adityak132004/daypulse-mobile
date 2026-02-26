/**
 * Parse opening hours string (e.g. from Google Places weekdayDescriptions)
 * and determine if the place is currently open.
 */

const DAY_NAMES_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Parse a time string like "6:00 AM", "9:00 PM", "06:00", "21:00" to minutes since midnight.
 */
function parseTimeToMinutes(timeStr: string): number | null {
  const s = timeStr.trim();
  const match12 = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = parseInt(match12[2], 10);
    const ampm = match12[3].toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }
  const match24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const h = parseInt(match24[1], 10);
    const m = parseInt(match24[2], 10);
    return h * 60 + m;
  }
  return null;
}

/** Format minutes since midnight as "h:mm AM/PM". */
function formatMinutesTo12h(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get today's line from a joined hours string (e.g. "Monday: 6:00 AM – 9:00 PM · Tuesday: ...").
 */
function getTodaysLine(hoursStr: string): string | null {
  const now = new Date();
  const dayIndex = now.getDay();
  const longName = DAY_NAMES_LONG[dayIndex];
  const shortName = DAY_NAMES_SHORT[dayIndex];
  const lines = hoursStr.split(' · ');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(longName + ':') || trimmed.startsWith(shortName + ':')) {
      return trimmed;
    }
  }
  return lines[dayIndex]?.trim() ?? null;
}

/**
 * Returns true if open now, false if closed, null if unknown (no hours or parse failed).
 */
export function isPlaceOpenNow(hoursOfOperation: string | null | undefined): boolean | null {
  if (!hoursOfOperation?.trim()) return null;
  const line = getTodaysLine(hoursOfOperation);
  if (!line) return null;

  const afterColon = line.includes(':') ? line.slice(line.indexOf(':') + 1).trim() : line;
  if (/closed/i.test(afterColon) && !/open\s*24/i.test(afterColon)) return false;
  if (/open\s*24|24\s*hour|00:00\s*[–-]\s*24:00|12:00\s*AM\s*[–-]\s*11:59\s*PM/i.test(afterColon)) return true;

  const rangeMatch = afterColon.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[–-]\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i)
    ?? afterColon.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
  if (!rangeMatch) return null;

  const openMin = parseTimeToMinutes(rangeMatch[1].trim());
  const closeMin = parseTimeToMinutes(rangeMatch[2].trim());
  if (openMin == null || closeMin == null) return null;

  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  if (closeMin > openMin) {
    return currentMin >= openMin && currentMin <= closeMin;
  }
  return currentMin >= openMin || currentMin <= closeMin;
}

export type PlaceStatus =
  | { isOpen: true; closesAt: string }
  | { isOpen: false; opensAt: string }
  | null;

/**
 * Returns open/closed status plus the relevant time for display:
 * - When open: closesAt (e.g. "9:00 PM")
 * - When closed: opensAt (next opening, e.g. "6:00 AM")
 */
export function getPlaceStatus(hoursOfOperation: string | null | undefined): PlaceStatus {
  if (!hoursOfOperation?.trim()) return null;
  const lines = hoursOfOperation.split(' · ');
  const now = new Date();
  const dayIndex = now.getDay();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  const longName = DAY_NAMES_LONG[dayIndex];
  const shortName = DAY_NAMES_SHORT[dayIndex];
  let todayLine: string | null = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(longName + ':') || trimmed.startsWith(shortName + ':')) {
      todayLine = trimmed;
      break;
    }
  }
  todayLine = todayLine ?? lines[dayIndex]?.trim() ?? null;
  if (!todayLine) return null;

  const afterColon = todayLine.includes(':') ? todayLine.slice(todayLine.indexOf(':') + 1).trim() : todayLine;
  if (/closed/i.test(afterColon) && !/open\s*24/i.test(afterColon)) {
    const nextDayIndex = (dayIndex + 1) % 7;
    const nextLine = lines.find((l) => {
      const t = l.trim();
      return t.startsWith(DAY_NAMES_LONG[nextDayIndex] + ':') || t.startsWith(DAY_NAMES_SHORT[nextDayIndex] + ':');
    }) ?? lines[nextDayIndex]?.trim();
    const opensAt = parseOpensAt(nextLine);
    return opensAt ? { isOpen: false, opensAt } : null;
  }
  if (/open\s*24|24\s*hour|00:00\s*[–-]\s*24:00|12:00\s*AM\s*[–-]\s*11:59\s*PM/i.test(afterColon)) {
    return { isOpen: true, closesAt: '11:59 PM' };
  }

  const rangeMatch = afterColon.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[–-]\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i)
    ?? afterColon.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
  if (!rangeMatch) return null;

  const openMin = parseTimeToMinutes(rangeMatch[1].trim());
  const closeMin = parseTimeToMinutes(rangeMatch[2].trim());
  if (openMin == null || closeMin == null) return null;

  const isOpen =
    closeMin > openMin
      ? currentMin >= openMin && currentMin <= closeMin
      : currentMin >= openMin || currentMin <= closeMin;

  if (isOpen) {
    return { isOpen: true, closesAt: formatMinutesTo12h(closeMin) };
  }
  if (currentMin < openMin) {
    return { isOpen: false, opensAt: formatMinutesTo12h(openMin) };
  }
  const nextDayIndex = (dayIndex + 1) % 7;
  const nextLine = lines.find((l) => {
    const t = l.trim();
    return t.startsWith(DAY_NAMES_LONG[nextDayIndex] + ':') || t.startsWith(DAY_NAMES_SHORT[nextDayIndex] + ':');
  }) ?? lines[nextDayIndex]?.trim();
  const opensAt = parseOpensAt(nextLine);
  return opensAt ? { isOpen: false, opensAt } : null;
}

function parseOpensAt(line: string | undefined): string | null {
  if (!line?.trim()) return null;
  const afterColon = line.includes(':') ? line.slice(line.indexOf(':') + 1).trim() : line;
  if (/closed/i.test(afterColon)) return null;
  const rangeMatch = afterColon.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[–-]\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i)
    ?? afterColon.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
  if (!rangeMatch) return null;
  const openMin = parseTimeToMinutes(rangeMatch[1].trim());
  return openMin != null ? formatMinutesTo12h(openMin) : null;
}

export type DayHours = { dayName: string; hoursText: string };

/**
 * Parse hours string into an array of day + hours, starting with today and
 * then the next 6 days (e.g. Tuesday, Wednesday, ..., Monday).
 */
export function getHoursByDayStartingToday(hoursOfOperation: string | null | undefined): DayHours[] {
  if (!hoursOfOperation?.trim()) return [];
  const lines = hoursOfOperation.split(' · ').map((l) => l.trim());
  const todayIndex = new Date().getDay();
  const result: DayHours[] = [];
  for (let i = 0; i < 7; i++) {
    const dayIndex = (todayIndex + i) % 7;
    const dayName = DAY_NAMES_LONG[dayIndex];
    let line: string | undefined =
      lines.find((l) => l.startsWith(dayName + ':') || l.startsWith(DAY_NAMES_SHORT[dayIndex] + ':'))
      ?? lines[dayIndex];
    if (!line) continue;
    const colonIdx = line.indexOf(':');
    const hoursText = colonIdx >= 0 ? line.slice(colonIdx + 1).trim() : line;
    result.push({ dayName, hoursText: hoursText || '—' });
  }
  return result;
}
