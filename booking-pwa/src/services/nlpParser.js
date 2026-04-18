import { format, addDays } from 'date-fns'

/**
 * Parses a natural-language booking command and returns a partial booking object.
 *
 * Recognises:
 *   • Location name  (Shimla / Manali)
 *   • Room number    ("room 101", "room A1", bare alphanumeric like "101")
 *   • Guest name     ("for Rajesh Kumar", "guest Priya", "[Name] checking in")
 *   • Nights         ("3 nights", "one night")
 *   • Check-in       ("today", "tomorrow")
 *   • Flags          helicopter, assistance / wheelchair
 */
export function parseBookingCommand(text, config) {
  const raw = text.trim()
  const t = raw.toLowerCase()
  const result = {}

  // ── Location ────────────────────────────────────────────────────────────
  for (const loc of config.locations) {
    if (t.includes(loc.name.toLowerCase())) {
      result.locationId = loc.id
      break
    }
  }

  // ── Room ────────────────────────────────────────────────────────────────
  // Walk all rooms; prefer the location we already identified
  const locPool = result.locationId
    ? config.locations.filter((l) => l.id === result.locationId)
    : config.locations

  outer: for (const loc of locPool) {
    for (const room of loc.rooms) {
      const rl = room.toLowerCase()
      // "room 101" or bare word boundary match
      if (
        t.includes('room ' + rl) ||
        new RegExp(`(?<![a-z0-9])${rl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z0-9])`, 'i').test(t)
      ) {
        result.room = room
        if (!result.locationId) result.locationId = loc.id
        break outer
      }
    }
  }

  // ── Nights ──────────────────────────────────────────────────────────────
  const WORD_NUMS = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  }
  const nightsDigit = t.match(/(\d+)\s+nights?/)
  const nightsWord = t.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\s+nights?/)
  if (nightsDigit) {
    result.nights = parseInt(nightsDigit[1], 10)
  } else if (nightsWord) {
    result.nights = WORD_NUMS[nightsWord[1]]
  }

  // ── Check-in date ───────────────────────────────────────────────────────
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  if (t.includes('today') || t.includes('tonight')) {
    result.checkIn = todayStr
  } else if (t.includes('tomorrow')) {
    result.checkIn = tomorrowStr
  }

  // ── Boolean flags ───────────────────────────────────────────────────────
  if (/helicopter/.test(t)) result.helicopter = true
  if (/\b(assistance|wheelchair|disabled|mobility)\b/.test(t)) result.assistance = true

  // ── Guest name ──────────────────────────────────────────────────────────
  // Try explicit markers first, then fall back to leading capitalised words
  const capitalisedName = '[A-Z][a-zà-ÿ]+'
  const multiWord = `${capitalisedName}(?:\\s+${capitalisedName})*`

  const patterns = [
    new RegExp(`\\bfor\\s+(${multiWord})`, 'i'),
    new RegExp(`\\bguest[: ]+\\s*(${multiWord})`, 'i'),
    new RegExp(`(${multiWord})\\s+(?:checking in|check.?in|arrival|arrives?)`, 'i'),
    new RegExp(`\\bname[: ]+\\s*(${multiWord})`, 'i'),
  ]

  for (const re of patterns) {
    const m = raw.match(re)
    if (m) {
      const candidate = m[1].trim()
      // Reject single common words that aren't names
      const stopWords = /^(Room|Book|Booking|Check|With|For|And|The|Tonight|Tomorrow|Today|Shimla|Manali)$/i
      if (!stopWords.test(candidate)) {
        result.guestName = candidate
        break
      }
    }
  }

  return result
}
