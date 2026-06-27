import { Solar } from 'lunar-javascript';

/**
 * Parses birth or death date string (supports YYYY-MM-DD or YYYY)
 */
export function parseDateStr(str: string): { year: number; month?: number; day?: number } {
  if (!str) return { year: 0 };
  
  // Try matching YYYY-MM-DD
  const fullMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (fullMatch) {
    return {
      year: parseInt(fullMatch[1], 10),
      month: parseInt(fullMatch[2], 10),
      day: parseInt(fullMatch[3], 10)
    };
  }

  // Try matching DD/MM/YYYY
  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    return {
      year: parseInt(slashMatch[3], 10),
      month: parseInt(slashMatch[2], 10),
      day: parseInt(slashMatch[1], 10)
    };
  }

  // Try parsing number
  const parsed = parseInt(str, 10);
  if (!isNaN(parsed) && parsed > 0) {
    return { year: parsed };
  }

  return { year: 0 };
}

/**
 * Extracts a year number from date string
 */
export function getYearFromStr(str: string): number {
  return parseDateStr(str).year;
}

/**
 * Maps a Gregorian year to Vietnamese Lunar Can-Chi name
 */
export function getCanChi(year: number): string {
  if (!year || year <= 0) return '';
  
  const cans = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
  const chis = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
  
  // Formula: Year - 4
  const canIndex = (year - 4) % 10;
  const chiIndex = (year - 4) % 12;
  
  const can = cans[canIndex < 0 ? canIndex + 10 : canIndex];
  const chi = chis[chiIndex < 0 ? chiIndex + 12 : chiIndex];
  
  return `${can} ${chi}`;
}

/**
 * Converts a Solar Date string (YYYY-MM-DD) to a beautiful Vietnamese Lunar Calendar string
 */
export function solarToLunarStr(dateStr: string): string {
  const parsed = parseDateStr(dateStr);
  if (!parsed.year) return '';

  if (parsed.month && parsed.day) {
    try {
      const solar = Solar.fromYmd(parsed.year, parsed.month, parsed.day);
      const lunar = solar.getLunar();
      const lunarYear = lunar.getYear();
      const lunarMonth = lunar.getMonth();
      const lunarDay = lunar.getDay();
      
      const canChiYear = getCanChi(lunarYear);
      const monthStr = lunarMonth < 0 
        ? `Tháng ${Math.abs(lunarMonth)} nhuận` 
        : `Tháng ${lunarMonth}`;
      
      return `Ngày ${lunarDay} ${monthStr} năm ${canChiYear} (Âm lịch)`;
    } catch (e) {
      console.error('Error converting solar to lunar:', e);
    }
  }

  // If we only have year, return the Lunar Can-Chi of that year
  const canChiYear = getCanChi(parsed.year);
  if (canChiYear) {
    return `Năm ${canChiYear} (Âm lịch)`;
  }

  return '';
}

/**
 * Formats YYYY-MM-DD to DD/MM/YYYY
 */
export function formatSolarDate(dateStr: string): string {
  const parsed = parseDateStr(dateStr);
  if (!parsed.year) return dateStr || 'Chưa rõ';
  if (parsed.month && parsed.day) {
    const d = String(parsed.day).padStart(2, '0');
    const m = String(parsed.month).padStart(2, '0');
    return `${d}/${m}/${parsed.year}`;
  }
  return String(parsed.year);
}

/**
 * Calculates human-friendly Vietnamese age (Hưởng thọ / Hưởng dương / Tuổi sống)
 */
export function calculateAgeInfo(birthStr: string, deathStr?: string, isDeceased?: boolean) {
  const bYear = getYearFromStr(birthStr);
  if (!bYear) {
    return {
      age: 0,
      text: '',
      hasAge: false
    };
  }

  const currentYear = new Date().getFullYear();
  const dYear = isDeceased || deathStr ? getYearFromStr(deathStr || '') : 0;

  if (isDeceased || dYear) {
    if (!dYear) {
      return {
        age: 0,
        text: 'Đã mất',
        hasAge: false
      };
    }
    const age = dYear - bYear;
    if (age >= 60) {
      return {
        age,
        text: `Hưởng thọ ${age} tuổi`,
        hasAge: true
      };
    } else if (age >= 0) {
      return {
        age,
        text: `Hưởng dương ${age} tuổi`,
        hasAge: true
      };
    } else {
      return {
        age: 0,
        text: 'Đã mất',
        hasAge: false
      };
    }
  } else {
    const age = currentYear - bYear;
    return {
      age,
      text: `${age} tuổi`,
      hasAge: age >= 0
    };
  }
}
