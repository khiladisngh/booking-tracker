import { format, addDays, parseISO } from 'date-fns'

const WORD_NUMS = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
}

/**
 * Parses a natural-language booking command and returns a partial booking object.
 *
 * config.locations  — array of { id, name, rooms[] } from app config
 * knownLocations    — extra string location names from existing bookings
 */
export function parseBookingCommand(text, config, knownLocations = []) {
  const raw = text.trim()
  const t = raw.toLowerCase()
  const result = {}

  // ── Location ────────────────────────────────────────────────────────────────
  // Check config locations (have room lists)
  for (const loc of config.locations) {
    if (t.includes(loc.name.toLowerCase())) {
      result.locationId = loc.id
      result.locationName = loc.name
      break
    }
  }

  // Fall back to dynamic locations from actual bookings
  if (!result.locationName) {
    for (const name of knownLocations) {
      if (t.includes(name.toLowerCase())) {
        result.locationName = name
        break
      }
    }
  }

  // ── Room ────────────────────────────────────────────────────────────────────
  const locPool = result.locationId
    ? config.locations.filter((l) => l.id === result.locationId)
    : config.locations

  outer: for (const loc of locPool) {
    for (const room of loc.rooms) {
      const rl = room.toLowerCase()
      if (
        t.includes('room ' + rl) ||
        new RegExp(`(?<![a-z0-9])${rl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z0-9])`, 'i').test(t)
      ) {
        result.room = room
        if (!result.locationId) result.locationId = loc.id
        if (!result.locationName) result.locationName = loc.name
        break outer
      }
    }
  }

  // ── Nights ──────────────────────────────────────────────────────────────────
  const nightsDigit = t.match(/(\d+)\s+nights?/)
  const nightsWord = t.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen)\s+nights?/)
  if (nightsDigit) {
    result.nights = parseInt(nightsDigit[1], 10)
  } else if (nightsWord) {
    result.nights = WORD_NUMS[nightsWord[1]]
  }

  // ── Check-in date ───────────────────────────────────────────────────────────
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const dayAfterStr = format(addDays(new Date(), 2), 'yyyy-MM-dd')

  if (t.includes('day after tomorrow')) {
    result.checkIn = dayAfterStr
  } else if (t.includes('today') || t.includes('tonight')) {
    result.checkIn = todayStr
  } else if (t.includes('tomorrow')) {
    result.checkIn = tomorrowStr
  } else {
    // Try "19th", "20th April", "April 21", "21 April"
    const months = ['january','february','march','april','may','june','july','august','september','october','november','december']
    const monthNums = { january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12 }
    const now = new Date()

    // "21 april" or "april 21" or "21st april" etc.
    let day = null, mon = null
    const dmMatch = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/)
    const mdMatch = t.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?\b/)
    if (dmMatch) { day = parseInt(dmMatch[1], 10); mon = monthNums[dmMatch[2]] }
    else if (mdMatch) { day = parseInt(mdMatch[2], 10); mon = monthNums[mdMatch[1]] }

    if (day && mon) {
      let year = now.getFullYear()
      const candidate = new Date(year, mon - 1, day)
      // If the date is in the past, assume next year
      if (candidate < now) year++
      result.checkIn = format(new Date(year, mon - 1, day), 'yyyy-MM-dd')
    } else {
      // Bare ordinal: "the 19th", "19th"
      const ordMatch = t.match(/\bthe\s+(\d{1,2})(?:st|nd|rd|th)\b|\b(\d{1,2})(?:st|nd|rd|th)\b/)
      if (ordMatch) {
        day = parseInt(ordMatch[1] ?? ordMatch[2], 10)
        const candidate = new Date(now.getFullYear(), now.getMonth(), day)
        if (candidate <= now) candidate.setMonth(candidate.getMonth() + 1)
        result.checkIn = format(candidate, 'yyyy-MM-dd')
      }
    }
  }

  // ── Boolean flags ───────────────────────────────────────────────────────────
  if (/helicopter/.test(t)) result.helicopter = true
  if (/\b(assistance|wheelchair|disabled|mobility)\b/.test(t)) result.assistance = true

  // ── Guest name ──────────────────────────────────────────────────────────────
  const capitalisedName = '[A-Z][a-zà-ÿ]+'
  const multiWord = `${capitalisedName}(?:\\s+${capitalisedName})*`
  const stopWords = /^(Room|Book|Booking|Check|With|For|And|The|Tonight|Tomorrow|Today|Night|Nights|Helicopter|Assistance|January|February|March|April|May|June|July|August|September|October|November|December)$/i

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
      if (!stopWords.test(candidate) && !config.locations.some(l => l.name === candidate)) {
        result.guestName = candidate
        break
      }
    }
  }

  return result
}
