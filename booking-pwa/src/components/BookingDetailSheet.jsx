import { useState, useMemo } from 'react'
import { addDays, format, parseISO, differenceInDays } from 'date-fns'
import { motion } from 'framer-motion'
import { Plane, Link, BedDouble } from 'lucide-react'
import { useStore } from '../store/useStore'
import { formatDate } from '../services/dateUtils'
import RemarksEditor from './RemarksEditor'
import FlagsEditor from './FlagsEditor'
import { useEditModeContext } from '../context/EditModeContext'

const SPRING = { type: 'spring', stiffness: 380, damping: 36 }

// ─── Shared delete confirmation ───────────────────────────────────────────────

function DeleteConfirmation({ onConfirm, onCancel }) {
  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4 text-center">
        <p className="text-hi font-semibold text-[15px]">Delete this booking?</p>
        <p className="text-lo text-[13px]">This cannot be undone.</p>
      </div>
      <div className="flex gap-2.5 mt-6">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 touch-target">
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 touch-target bg-urgent/90 text-white rounded-[12px] py-3 text-[14px] font-semibold active:bg-urgent transition-colors duration-[120ms]"
        >
          Confirm Delete
        </button>
      </div>
    </>
  )
}

// ─── Room booking — view ──────────────────────────────────────────────────────

function RoomViewMode({ booking, linkedHeli, onEdit, onRequestDelete, onAddHeli, onViewHeli }) {
  const { isEditMode } = useEditModeContext()
  const remarksList = Array.isArray(booking.remarks)
    ? booking.remarks.filter(Boolean)
    : booking.remarks ? [booking.remarks] : []
  const activeCustomFlags = (booking.customFlags ?? []).filter((f) => f.checked)

  return (
    <>
      <h2 className="text-[22px] font-bold text-hi leading-tight">{booking.guestName}</h2>

      <div className="flex items-center gap-2 mt-1">
        <span className="text-lo text-[13px]">{booking.location}</span>
        <span className="badge badge-accent">{booking.room}</span>
      </div>

      <div className="flex items-center gap-2 mt-4 text-[13px]">
        <span className="text-hi">{formatDate(booking.checkIn)}</span>
        <span className="text-dim">→</span>
        <span className="text-hi">{formatDate(booking.checkOut)}</span>
        <span className="ml-1 text-lo">
          · {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
        </span>
      </div>

      {(booking.assistance || activeCustomFlags.length > 0) && (
        <div className="flex gap-2 mt-4 flex-wrap">
          {booking.assistance && <span className="tag tag-violet">Assistance</span>}
          {activeCustomFlags.map((f) => (
            <span key={f.id} className="tag tag-custom">{f.label}</span>
          ))}
        </div>
      )}

      {remarksList.length > 0 && (
        <ul className="mt-4 space-y-1">
          {remarksList.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-lo">
              <span className="shrink-0 mt-[3px] text-[9px]">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Helicopter link section */}
      <div className="mt-5">
        {linkedHeli ? (
          <button
            type="button"
            onClick={onViewHeli}
            className="w-full flex items-center gap-3 glass rounded-[12px] px-4 py-3 active:opacity-70 transition-opacity"
          >
            <Plane size={15} className="text-sky-400 shrink-0" strokeWidth={2} />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-medium text-hi">Helicopter booked</p>
              <p className="text-[12px] text-lo truncate">
                {formatDate(linkedHeli.travelDate)} · {linkedHeli.boardingFrom} → {linkedHeli.landingTo}
              </p>
            </div>
            <Link size={13} className="text-sky-400 shrink-0" strokeWidth={2} />
          </button>
        ) : (
          isEditMode && (
            <button
              type="button"
              onClick={onAddHeli}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-[12px] border border-dashed border-white/20 text-lo text-[13px] active:border-sky-400/50 active:text-sky-400 transition-colors"
            >
              <Plane size={14} strokeWidth={2} />
              <span>Add helicopter booking</span>
            </button>
          )
        )}
      </div>

      <div className="flex-1" />

      {isEditMode && (
        <div className="flex gap-2.5 mt-6">
          <button type="button" onClick={onRequestDelete} className="btn-danger flex-1 touch-target">
            Delete
          </button>
          <button type="button" onClick={onEdit} className="btn-primary flex-1 touch-target">
            Edit
          </button>
        </div>
      )}
    </>
  )
}

// ─── Room booking — edit ──────────────────────────────────────────────────────

function computeCheckOut(checkIn, nights) {
  if (!checkIn || !nights || Number(nights) < 1) return ''
  try {
    return format(addDays(parseISO(checkIn), Number(nights)), 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

function RoomEditMode({ booking, onSave, onCancel }) {
  const bookings = useStore((s) => s.bookings)

  const [location, setLocation]   = useState(booking.location ?? '')
  const [room, setRoom]           = useState(booking.room)
  const [guestName, setGuestName] = useState(booking.guestName)
  const [checkIn, setCheckIn]     = useState(booking.checkIn)
  const [nights, setNights]       = useState(String(booking.nights))
  const [checkOut, setCheckOut]   = useState(booking.checkOut)
  const [assistance, setAssistance] = useState(booking.assistance)
  const [customFlags, setCustomFlags] = useState(booking.customFlags ?? [])
  const [remarks, setRemarks] = useState(() => {
    const r = booking.remarks
    if (Array.isArray(r)) return r
    return r ? [r] : []
  })

  const locationSuggestions = useMemo(
    () => [...new Set(bookings.filter((b) => b.type === 'room').map((b) => b.location).filter(Boolean))].sort(),
    [bookings]
  )
  const roomSuggestions = useMemo(() => {
    if (!location) return []
    const norm = location.trim().toLowerCase()
    return [
      ...new Set(
        bookings
          .filter((b) => b.type === 'room' && b.location.toLowerCase() === norm)
          .map((b) => b.room)
          .filter(Boolean)
      ),
    ].sort()
  }, [bookings, location])

  function handleCheckInChange(val) {
    setCheckIn(val)
    const co = computeCheckOut(val, nights)
    if (co) setCheckOut(co)
  }

  function handleNightsChange(val) {
    setNights(val)
    const co = computeCheckOut(checkIn, val)
    if (co) setCheckOut(co)
  }

  function handleCheckOutChange(val) {
    setCheckOut(val)
    if (checkIn && val) {
      try {
        const n = differenceInDays(parseISO(val), parseISO(checkIn))
        if (n >= 1) setNights(String(n))
      } catch {}
    }
  }

  function handleFlagsChange({ assistance: a, customFlags: cf }) {
    setAssistance(a)
    setCustomFlags(cf)
  }

  function handleSave() {
    if (!location.trim() || !room.trim() || !guestName.trim() || !checkIn || Number(nights) < 1) return
    onSave({
      location: location.trim(),
      room: room.trim(),
      guestName: guestName.trim(),
      checkIn,
      nights: Number(nights),
      checkOut: checkOut || computeCheckOut(checkIn, nights) || booking.checkOut,
      assistance,
      customFlags,
      remarks,
    })
  }

  return (
    <>
      <div className="space-y-4 overflow-y-auto flex-1 pb-2">
        <div>
          <label className="block text-[12px] text-lo mb-1.5">Location</label>
          <input
            type="text"
            list="edit-locations-list"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Shimla, Manali"
            className="field"
            autoComplete="off"
          />
          <datalist id="edit-locations-list">
            {locationSuggestions.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>

        <div>
          <label className="block text-[12px] text-lo mb-1.5">Room</label>
          <input
            type="text"
            list="edit-rooms-list"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="e.g. 101, A1"
            className="field"
            autoComplete="off"
          />
          <datalist id="edit-rooms-list">
            {roomSuggestions.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>

        <div>
          <label className="block text-[12px] text-lo mb-1.5">Guest name</label>
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Guest name"
            className="field"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] text-lo mb-1.5">Check in</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => handleCheckInChange(e.target.value)}
              className="field"
            />
          </div>
          <div>
            <label className="block text-[12px] text-lo mb-1.5">Check out</label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => handleCheckOutChange(e.target.value)}
              className="field"
            />
          </div>
        </div>

        <div className="w-1/2 pr-1.5">
          <label className="block text-[12px] text-lo mb-1.5">Nights</label>
          <input
            type="number"
            min={1}
            value={nights}
            onChange={(e) => handleNightsChange(e.target.value)}
            className="field"
          />
        </div>

        <FlagsEditor
          assistance={assistance}
          customFlags={customFlags}
          onChange={handleFlagsChange}
        />

        <RemarksEditor remarks={remarks} onChange={setRemarks} />
      </div>

      <div className="flex gap-2.5 mt-6 shrink-0">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 touch-target">
          Cancel
        </button>
        <button type="button" onClick={handleSave} className="btn-primary flex-1 touch-target">
          Save
        </button>
      </div>
    </>
  )
}

// ─── Helicopter booking — view ────────────────────────────────────────────────

function HeliViewMode({ booking, linkedRoom, onEdit, onRequestDelete, onAddRoom, onViewRoom }) {
  const { isEditMode } = useEditModeContext()
  const remarksList = Array.isArray(booking.remarks)
    ? booking.remarks.filter(Boolean)
    : booking.remarks ? [booking.remarks] : []

  return (
    <>
      <div className="flex items-center gap-2 mb-1">
        <Plane size={16} className="text-sky-400 shrink-0" strokeWidth={2} />
        <h2 className="text-[22px] font-bold text-hi leading-tight">{booking.guestName}</h2>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <span className="text-lo text-[13px]">{formatDate(booking.travelDate)}</span>
        <span className="tag tag-sky">
          {booking.tickets} {booking.tickets === 1 ? 'ticket' : 'tickets'}
        </span>
      </div>

      {(booking.boardingFrom || booking.landingTo) && (
        <p className="mt-3 text-[13px] text-hi">
          <span className="text-lo">{booking.boardingFrom || '—'}</span>
          <span className="mx-2 text-dim">→</span>
          <span className="text-lo">{booking.landingTo || '—'}</span>
        </p>
      )}

      {booking.passengers?.length > 0 && (
        <div className="mt-4">
          <p className="text-[12px] text-dim mb-1.5">Passengers</p>
          <div className="space-y-1">
            {booking.passengers.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 text-[13px]">
                <span className="text-dim w-4 text-right shrink-0">{i + 1}.</span>
                <span className="text-hi">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {remarksList.length > 0 && (
        <ul className="mt-4 space-y-1">
          {remarksList.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-lo">
              <span className="shrink-0 mt-[3px] text-[9px]">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Room link section */}
      <div className="mt-5">
        {linkedRoom ? (
          <button
            type="button"
            onClick={onViewRoom}
            className="w-full flex items-center gap-3 glass rounded-[12px] px-4 py-3 active:opacity-70 transition-opacity"
          >
            <BedDouble size={15} className="text-accent shrink-0" strokeWidth={2} />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-medium text-hi">Room booked</p>
              <p className="text-[12px] text-lo truncate">
                {linkedRoom.location} · Room {linkedRoom.room} · {formatDate(linkedRoom.checkIn)}
              </p>
            </div>
            <Link size={13} className="text-accent shrink-0" strokeWidth={2} />
          </button>
        ) : (
          isEditMode && (
            <button
              type="button"
              onClick={onAddRoom}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-[12px] border border-dashed border-white/20 text-lo text-[13px] active:border-accent/50 active:text-accent transition-colors"
            >
              <BedDouble size={14} strokeWidth={2} />
              <span>Add room booking</span>
            </button>
          )
        )}
      </div>

      <div className="flex-1" />

      {isEditMode && (
        <div className="flex gap-2.5 mt-6">
          <button type="button" onClick={onRequestDelete} className="btn-danger flex-1 touch-target">
            Delete
          </button>
          <button type="button" onClick={onEdit} className="btn-primary flex-1 touch-target">
            Edit
          </button>
        </div>
      )}
    </>
  )
}

// ─── Helicopter booking — edit ────────────────────────────────────────────────

function HeliEditMode({ booking, onSave, onCancel }) {
  const bookings = useStore((s) => s.bookings)

  const [guestName,    setGuestName]    = useState(booking.guestName)
  const [travelDate,   setTravelDate]   = useState(booking.travelDate)
  const [boardingFrom, setBoardingFrom] = useState(booking.boardingFrom ?? '')
  const [landingTo,    setLandingTo]    = useState(booking.landingTo ?? '')
  const [tickets,      setTickets]      = useState(booking.tickets ?? 1)
  const [passengers,   setPassengers]   = useState(booking.passengers ?? [])
  const [remarks,      setRemarks]      = useState(() => {
    const r = booking.remarks
    if (Array.isArray(r)) return r
    return r ? [r] : []
  })
  const [draftName, setDraftName] = useState('')

  const boardingSuggestions = useMemo(
    () => [...new Set(bookings.filter((b) => b.type === 'helicopter').map((b) => b.boardingFrom).filter(Boolean))].sort(),
    [bookings]
  )
  const landingSuggestions = useMemo(
    () => [...new Set(bookings.filter((b) => b.type === 'helicopter').map((b) => b.landingTo).filter(Boolean))].sort(),
    [bookings]
  )

  function addPassenger() {
    const name = draftName.trim()
    if (!name) return
    setPassengers((prev) => [...prev, { id: `pax-${Date.now()}`, name }])
    setDraftName('')
  }

  function removePassenger(id) {
    setPassengers((prev) => prev.filter((p) => p.id !== id))
  }

  function handleSave() {
    if (!guestName.trim() || !travelDate || !boardingFrom.trim() || !landingTo.trim()) return
    onSave({
      guestName:   guestName.trim(),
      travelDate,
      boardingFrom: boardingFrom.trim(),
      landingTo:    landingTo.trim(),
      tickets:      Math.max(1, Number(tickets) || 1),
      passengers,
      remarks,
    })
  }

  return (
    <>
      <div className="space-y-4 overflow-y-auto flex-1 pb-2">
        <div>
          <label className="block text-[12px] text-lo mb-1.5">Guest name</label>
          <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="field" />
        </div>

        <div>
          <label className="block text-[12px] text-lo mb-1.5">Travel date</label>
          <input type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} className="field" />
        </div>

        <div>
          <label className="block text-[12px] text-lo mb-1.5">Boarding from</label>
          <input
            type="text" list="edit-heli-boarding" value={boardingFrom}
            onChange={(e) => setBoardingFrom(e.target.value)}
            placeholder="e.g. Jubbarhatti Airport" className="field" autoComplete="off"
          />
          <datalist id="edit-heli-boarding">
            {boardingSuggestions.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>

        <div>
          <label className="block text-[12px] text-lo mb-1.5">Landing to</label>
          <input
            type="text" list="edit-heli-landing" value={landingTo}
            onChange={(e) => setLandingTo(e.target.value)}
            placeholder="e.g. Shimla Helipad" className="field" autoComplete="off"
          />
          <datalist id="edit-heli-landing">
            {landingSuggestions.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>

        <div className="w-1/2 pr-1.5">
          <label className="block text-[12px] text-lo mb-1.5">Tickets</label>
          <input type="number" min={1} max={20} value={tickets}
            onChange={(e) => setTickets(Math.max(1, Number(e.target.value) || 1))} className="field" />
        </div>

        {/* Passengers */}
        <div>
          <label className="block text-[12px] text-lo mb-1.5">Passengers</label>
          <div className="space-y-1.5 mb-2">
            {passengers.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 px-3 py-2 glass rounded-[10px]">
                <span className="text-[12px] text-dim w-5 shrink-0 text-right">{i + 1}.</span>
                <span className="flex-1 text-[13px] text-hi">{p.name}</span>
                <button type="button" onClick={() => removePassenger(p.id)}
                  className="shrink-0 text-dim text-[18px] leading-none active:text-lo w-7 h-7 flex items-center justify-center">×</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={draftName} onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPassenger())}
              placeholder="Passenger name" className="field flex-1" />
            <button type="button" onClick={addPassenger}
              className="shrink-0 px-4 py-2.5 rounded-[10px] glass text-accent-hi text-[13px] font-medium active:opacity-70 transition-opacity">
              Add
            </button>
          </div>
        </div>

        <RemarksEditor remarks={remarks} onChange={setRemarks} />
      </div>

      <div className="flex gap-2.5 mt-6 shrink-0">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 touch-target">Cancel</button>
        <button type="button" onClick={handleSave} className="btn-primary flex-1 touch-target">Save</button>
      </div>
    </>
  )
}

// ─── Sheet ────────────────────────────────────────────────────────────────────

export default function BookingDetailSheet({ booking, onClose, onAddLinked, onViewLinked }) {
  const updateBooking = useStore((s) => s.updateBooking)
  const deleteBooking = useStore((s) => s.deleteBooking)
  const bookings      = useStore((s) => s.bookings)

  const [mode, setMode] = useState('view')

  // Reset to view whenever a different booking is opened
  const bookingId = booking?.id
  useMemo(() => { setMode('view') }, [bookingId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Resolve linked booking objects
  const linkedHeli = booking?.type === 'room' && booking.linkedHelicopterId
    ? bookings.find((b) => b.id === booking.linkedHelicopterId) ?? null
    : null
  const linkedRoom = booking?.type === 'helicopter' && booking.linkedRoomId
    ? bookings.find((b) => b.id === booking.linkedRoomId) ?? null
    : null

  function handleSave(updates) {
    updateBooking(booking.id, updates)
    setMode('view')
  }

  function handleConfirmDelete() {
    deleteBooking(booking.id)
    onClose()
  }

  const isOpen = Boolean(booking)

  return (
    <>
      {/* Overlay */}
      <motion.div
        aria-hidden="true"
        onClick={isOpen ? onClose : undefined}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
      />

      {/* Sheet */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={booking ? `Booking for ${booking.guestName}` : 'Booking details'}
        animate={{ y: isOpen ? 0 : '100%' }}
        transition={SPRING}
        className="fixed bottom-0 left-0 right-0 z-50 glass-heavy rounded-t-[28px] max-h-[85vh] flex flex-col"
      >
        {/* Drag handle */}
        <button
          type="button"
          aria-label="Close sheet"
          onClick={onClose}
          className="flex justify-center pt-3 pb-1 w-full shrink-0 touch-target"
        >
          <span className="w-9 h-1 rounded-full bg-white/20" />
        </button>

        {/* Content */}
        <div className="flex flex-col flex-1 overflow-y-auto px-5 pb-8 pt-2 min-h-0">
          {booking && mode === 'view' && booking.type === 'room' && (
            <RoomViewMode
              booking={booking}
              linkedHeli={linkedHeli}
              onEdit={() => setMode('edit')}
              onRequestDelete={() => setMode('confirmDelete')}
              onAddHeli={() => onAddLinked?.('helicopter', { guestName: booking.guestName, linkedRoomId: booking.id })}
              onViewHeli={() => linkedHeli && onViewLinked?.(linkedHeli.id)}
            />
          )}
          {booking && mode === 'view' && booking.type === 'helicopter' && (
            <HeliViewMode
              booking={booking}
              linkedRoom={linkedRoom}
              onEdit={() => setMode('edit')}
              onRequestDelete={() => setMode('confirmDelete')}
              onAddRoom={() => onAddLinked?.('room', { guestName: booking.guestName, checkIn: booking.travelDate, linkedHelicopterId: booking.id })}
              onViewRoom={() => linkedRoom && onViewLinked?.(linkedRoom.id)}
            />
          )}
          {booking && mode === 'confirmDelete' && (
            <DeleteConfirmation
              onConfirm={handleConfirmDelete}
              onCancel={() => setMode('view')}
            />
          )}
          {booking && mode === 'edit' && booking.type === 'room' && (
            <RoomEditMode booking={booking} onSave={handleSave} onCancel={() => setMode('view')} />
          )}
          {booking && mode === 'edit' && booking.type === 'helicopter' && (
            <HeliEditMode booking={booking} onSave={handleSave} onCancel={() => setMode('view')} />
          )}
        </div>
      </motion.div>
    </>
  )
}
