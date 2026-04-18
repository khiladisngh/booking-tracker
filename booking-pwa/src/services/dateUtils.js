import { format, isToday, isTomorrow, isPast, differenceInDays, parseISO } from 'date-fns'

export function formatDate(dateStr) {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'dd MMM yyyy')
}

export function getUrgency(checkInStr) {
  const d = parseISO(checkInStr)
  if (isToday(d)) return 'red'
  if (isTomorrow(d)) return 'amber'
  if (isPast(d)) return 'past'
  const days = differenceInDays(d, new Date())
  return days <= 7 ? 'green' : 'blue'
}

export function calcCheckOut(checkIn, nights) {
  const d = parseISO(checkIn)
  return format(new Date(d.getTime() + nights * 86400000), 'yyyy-MM-dd')
}

export function groupBookings(bookings) {
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const tomorrowStr = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd')

  const arrivingToday = []
  const arrivingTomorrow = []
  const upcoming = []
  const past = []

  for (const b of bookings) {
    if (b.checkIn === todayStr) arrivingToday.push(b)
    else if (b.checkIn === tomorrowStr) arrivingTomorrow.push(b)
    else if (b.checkIn > todayStr) upcoming.push(b)
    else past.push(b)
  }

  return { arrivingToday, arrivingTomorrow, upcoming, past }
}
