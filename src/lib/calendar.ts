import { addDays, format, startOfDay } from 'date-fns'

function easterDate(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month, day)
}

function italianHolidays(year: number): Set<string> {
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd')
  const easter = easterDate(year)
  return new Set([
    `${year}-01-01`, // Capodanno
    `${year}-01-06`, // Epifania
    fmt(easter),                 // Pasqua
    fmt(addDays(easter, 1)),     // Lunedì di Pasqua
    `${year}-04-25`, // Liberazione
    `${year}-05-01`, // Festa del Lavoro
    `${year}-06-02`, // Repubblica
    `${year}-08-15`, // Ferragosto
    `${year}-11-01`, // Ognissanti
    `${year}-12-08`, // Immacolata
    `${year}-12-25`, // Natale
    `${year}-12-26`, // Santo Stefano
  ])
}

export function getNextWeekdays(count: number, availableDays?: number[]): Date[] {
  const days: Date[] = []
  let current = startOfDay(new Date())
  const year = current.getFullYear()
  const holidays = new Set([...italianHolidays(year), ...italianHolidays(year + 1)])
  while (days.length < count) {
    const isHoliday = holidays.has(format(current, 'yyyy-MM-dd'))
    if (!isHoliday) {
      if (availableDays) {
        const isoDay = current.getDay() === 0 ? 7 : current.getDay()
        if (availableDays.includes(isoDay)) days.push(current)
      } else if (current.getDay() !== 0) {
        days.push(current)
      }
    }
    current = addDays(current, 1)
  }
  return days
}
