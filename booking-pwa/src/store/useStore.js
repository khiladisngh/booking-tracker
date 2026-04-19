import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { addDays, format } from 'date-fns'
import appConfig from '../config/app.json'
import { idbStorage, migrateFromLocalStorage } from '../db/idbStorage'

const STORE_KEY = 'booking-store'

migrateFromLocalStorage(STORE_KEY)

const today = new Date()
const fmt = (d) => format(d, 'yyyy-MM-dd')

const SEED_BOOKINGS = [
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

export const useStore = create(
  persist(
    (set, get) => ({
      bookings: SEED_BOOKINGS,
      config: appConfig,
      activeLocation: 'all',
      backupTime: '22:00',

      setActiveLocation: (location) => set({ activeLocation: location }),
      setBookings: (bookings) => set({ bookings }),
      setBackupTime: (backupTime) => set({ backupTime }),

      addBooking: (booking) =>
        set((state) => ({ bookings: [booking, ...state.bookings] })),

      updateBooking: (id, updates) =>
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
          ),
        })),

      deleteBooking: (id) =>
        set((state) => ({ bookings: state.bookings.filter((b) => b.id !== id) })),

      // Link a room booking and a helicopter booking to each other.
      linkBookings: (roomId, heliId) =>
        set((state) => ({
          bookings: state.bookings.map((b) => {
            const ts = new Date().toISOString()
            if (b.id === roomId) return { ...b, linkedHelicopterId: heliId, updatedAt: ts }
            if (b.id === heliId) return { ...b, linkedRoomId: roomId, updatedAt: ts }
            return b
          }),
        })),

      // Remove the link between a room booking and a helicopter booking.
      unlinkBookings: (roomId, heliId) =>
        set((state) => ({
          bookings: state.bookings.map((b) => {
            const ts = new Date().toISOString()
            if (b.id === roomId) return { ...b, linkedHelicopterId: null, updatedAt: ts }
            if (b.id === heliId) return { ...b, linkedRoomId: null, updatedAt: ts }
            return b
          }),
        })),

      getBookingsByLocation: (location) => {
        const { bookings } = get()
        if (location === 'all') return bookings
        return bookings.filter((b) => b.location === location)
      },

      getUniqueLocations: () => {
        const { bookings } = get()
        return [...new Set(bookings.filter((b) => b.type === 'room').map((b) => b.location).filter(Boolean))].sort()
      },

      getTodayStats: () => {
        const { bookings } = get()
        const todayStr = fmt(new Date())
        const roomBookings = bookings.filter((b) => b.type === 'room')
        const arrivingToday = roomBookings.filter((b) => b.checkIn === todayStr)
        const departingToday = roomBookings.filter((b) => b.checkOut === todayStr)
        const occupied = roomBookings.filter(
          (b) => b.checkIn <= todayStr && b.checkOut > todayStr
        )
        return { arrivingToday, departingToday, occupied }
      },
    }),
    {
      name: STORE_KEY,
      storage: createJSONStorage(() => idbStorage),
      version: 5,
      migrate: (persistedState, fromVersion) => {
        let state = persistedState

        if (fromVersion < 2) {
          const locationMap = { shimla: 'Shimla', manali: 'Manali' }
          state = {
            ...state,
            bookings: (state.bookings ?? []).map((b) => ({
              ...b,
              location: locationMap[b.locationId] ?? b.locationId ?? '',
              remarks:
                typeof b.remarks === 'string'
                  ? b.remarks ? [b.remarks] : []
                  : (b.remarks ?? []),
              customFlags: b.customFlags ?? [],
            })),
          }
        }

        if (fromVersion < 3) {
          state = {
            ...state,
            bookings: (state.bookings ?? []).map((b) => ({
              ...b,
              helicopter: typeof b.helicopter === 'boolean'
                ? { enabled: b.helicopter, date: '', tickets: 1 }
                : (b.helicopter ?? { enabled: false, date: '', tickets: 1 }),
            })),
          }
        }

        if (fromVersion < 4) {
          state = {
            ...state,
            bookings: (state.bookings ?? []).map((b) => ({
              ...b,
              helicopter: {
                boardingFrom: '',
                landingTo: '',
                ...(b.helicopter ?? { enabled: false, date: '', tickets: 1 }),
              },
            })),
          }
        }

        if (fromVersion < 5) {
          state = {
            ...state,
            bookings: (state.bookings ?? []).map((b) => {
              // eslint-disable-next-line no-unused-vars
              const { helicopter, ...rest } = b
              return {
                type: 'room',
                linkedHelicopterId: null,
                ...rest,
              }
            }),
          }
        }

        return state
      },
    }
  )
)
