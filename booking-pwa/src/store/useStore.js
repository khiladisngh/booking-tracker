import { create } from 'zustand'
import { addDays, format } from 'date-fns'
import appConfig from '../config/app.json'
import {
  addBookingToFirestore,
  updateBookingInFirestore,
  deleteBookingFromFirestore,
  batchLinkBookings,
  batchUnlinkBookings,
} from '../services/firestoreSync'

const today = new Date()
const fmt   = (d) => format(d, 'yyyy-MM-dd')

export const SEED_BOOKINGS = [
  {
    id: 'seed-1',
    type: 'room',
    location: 'Shimla',
    room: '101',
    guestName: 'Rajesh Kumar',
    checkIn: fmt(addDays(today, 1)),
    nights: 3,
    checkOut: fmt(addDays(today, 4)),
    assistance: false,
    customFlags: [],
    remarks: ['Needs ground floor room'],
    linkedHelicopterId: 'seed-heli-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-2',
    type: 'room',
    location: 'Shimla',
    room: '103',
    guestName: 'Priya Sharma',
    checkIn: fmt(addDays(today, 1)),
    nights: 2,
    checkOut: fmt(addDays(today, 3)),
    assistance: true,
    customFlags: [],
    remarks: [],
    linkedHelicopterId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-3',
    type: 'room',
    location: 'Manali',
    room: 'A1',
    guestName: 'Vikram Singh',
    checkIn: fmt(today),
    nights: 4,
    checkOut: fmt(addDays(today, 4)),
    assistance: false,
    customFlags: [],
    remarks: ['Anniversary trip'],
    linkedHelicopterId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-4',
    type: 'room',
    location: 'Manali',
    room: 'B2',
    guestName: 'Anita Mehta',
    checkIn: fmt(addDays(today, 3)),
    nights: 5,
    checkOut: fmt(addDays(today, 8)),
    assistance: false,
    customFlags: [],
    remarks: [],
    linkedHelicopterId: 'seed-heli-2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-5',
    type: 'room',
    location: 'Shimla',
    room: '105',
    guestName: 'Suresh Patel',
    checkIn: fmt(addDays(today, -2)),
    nights: 3,
    checkOut: fmt(addDays(today, 1)),
    assistance: false,
    customFlags: [],
    remarks: ['Late checkout requested'],
    linkedHelicopterId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-heli-1',
    type: 'helicopter',
    guestName: 'Rajesh Kumar',
    travelDate: fmt(addDays(today, 1)),
    boardingFrom: 'Jubbarhatti Airport',
    landingTo: 'Shimla Helipad',
    tickets: 2,
    passengers: [
      { id: 'pax-seed-1', name: 'Rajesh Kumar' },
      { id: 'pax-seed-2', name: 'Sunita Kumar' },
    ],
    remarks: [],
    linkedRoomId: 'seed-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-heli-2',
    type: 'helicopter',
    guestName: 'Anita Mehta',
    travelDate: fmt(addDays(today, 3)),
    boardingFrom: 'Bhuntar Airport',
    landingTo: 'Manali Helipad',
    tickets: 2,
    passengers: [
      { id: 'pax-seed-3', name: 'Anita Mehta' },
      { id: 'pax-seed-4', name: 'Rohan Mehta' },
    ],
    remarks: [],
    linkedRoomId: 'seed-4',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const useStore = create((set, get) => ({
  bookings:       [],
  config:         appConfig,
  activeLocation: 'all',
  pendingWrites:  0,
  backupTime:     '22:00',

  setActiveLocation: (location) => set({ activeLocation: location }),
  setBookings:       (bookings) => set({ bookings }),
  setBackupTime:     (backupTime) => set({ backupTime }),

  _incPending: () => set((s) => ({ pendingWrites: s.pendingWrites + 1 })),
  _decPending: () => set((s) => ({ pendingWrites: Math.max(0, s.pendingWrites - 1) })),

  addBooking: (booking) => {
    const { _incPending, _decPending } = get()
    set((s) => ({ bookings: [booking, ...s.bookings] }))
    _incPending()
    addBookingToFirestore(booking).finally(_decPending)
  },

  updateBooking: (id, updates) => {
    const { _incPending, _decPending } = get()
    set((s) => ({
      bookings: s.bookings.map((b) =>
        b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
      ),
    }))
    _incPending()
    updateBookingInFirestore(id, updates).finally(_decPending)
  },

  deleteBooking: (id) => {
    const { _incPending, _decPending } = get()
    set((s) => ({ bookings: s.bookings.filter((b) => b.id !== id) }))
    _incPending()
    deleteBookingFromFirestore(id).finally(_decPending)
  },

  linkBookings: (roomId, heliId) => {
    const { _incPending, _decPending } = get()
    const ts = new Date().toISOString()
    set((s) => ({
      bookings: s.bookings.map((b) => {
        if (b.id === roomId) return { ...b, linkedHelicopterId: heliId, updatedAt: ts }
        if (b.id === heliId) return { ...b, linkedRoomId: roomId,       updatedAt: ts }
        return b
      }),
    }))
    _incPending()
    batchLinkBookings(roomId, heliId).finally(_decPending)
  },

  unlinkBookings: (roomId, heliId) => {
    const { _incPending, _decPending } = get()
    const ts = new Date().toISOString()
    set((s) => ({
      bookings: s.bookings.map((b) => {
        if (b.id === roomId) return { ...b, linkedHelicopterId: null, updatedAt: ts }
        if (b.id === heliId) return { ...b, linkedRoomId: null,       updatedAt: ts }
        return b
      }),
    }))
    _incPending()
    batchUnlinkBookings(roomId, heliId).finally(_decPending)
  },

  getBookingsByLocation: (location) => {
    const { bookings } = get()
    if (location === 'all') return bookings
    return bookings.filter((b) => b.location === location)
  },

  getUniqueLocations: () => {
    const { bookings } = get()
    return [
      ...new Set(
        bookings.filter((b) => b.type === 'room').map((b) => b.location).filter(Boolean)
      ),
    ].sort()
  },

  getTodayStats: () => {
    const { bookings } = get()
    const todayStr     = fmt(new Date())
    const roomBookings = bookings.filter((b) => b.type === 'room')
    return {
      arrivingToday:  roomBookings.filter((b) => b.checkIn === todayStr),
      departingToday: roomBookings.filter((b) => b.checkOut === todayStr),
      occupied:       roomBookings.filter((b) => b.checkIn <= todayStr && b.checkOut > todayStr),
    }
  },
}))
