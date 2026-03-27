import Holidays from 'date-holidays'
import { addDays, format, startOfDay } from 'date-fns'

const hd = new Holidays('IT')

function italianHolidays(year: number): Set<string> {
  return new Set(
    hd.getHolidays(year)
      .filter(h => h.type === 'public')
      .map(h => format(h.start, 'yyyy-MM-dd'))
  )
}

export function getNextWeekdays(count: number): Date[] {
  const days: Date[] = []
  let current = startOfDay(new Date())
  const year = current.getFullYear()
  const holidays = new Set([...italianHolidays(year), ...italianHolidays(year + 1)])
  while (days.length < count) {
    const isHoliday = holidays.has(format(current, 'yyyy-MM-dd'))
    if (current.getDay() !== 0 && !isHoliday) {
      days.push(current)
    }
    current = addDays(current, 1)
  }
  return days
}
