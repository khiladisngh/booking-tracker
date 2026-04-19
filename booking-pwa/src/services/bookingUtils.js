import { format, parseISO } from 'date-fns'

/**
 * Returns the display text for the helicopter tag on a booking card/sheet.
 * e.g. "Helicopter · 22 Apr · 2 tickets"
 */
export function heliTagText(helicopter) {
  if (!helicopter) return 'Helicopter'
  const parts = ['Helicopter']
  if (helicopter.date) {
    try { parts.push(format(parseISO(helicopter.date), 'd MMM')) } catch {}
  }
  if (helicopter.tickets === 1) parts.push('1 ticket')
  else if (helicopter.tickets > 1) parts.push(`${helicopter.tickets} tickets`)
  return parts.join(' · ')
}
