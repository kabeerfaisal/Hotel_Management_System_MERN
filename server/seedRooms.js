import 'dotenv/config'

import mongoose from 'mongoose'

import Room from './models/Room.js'

/**
 * Six signature rooms priced in PKR.
 * Re-running is safe: rooms are matched by roomNumber and only inserted
 * when missing, so staff edits to existing rooms are never overwritten.
 */
const rooms = [
  {
    roomNumber: '101',
    type: 'Standard',
    pricePerNight: 18000,
    capacity: 2,
    status: 'available',
    amenities: ['King Bed', 'High-Speed Wi-Fi', 'Smart TV', 'City View'],
    description:
      'A calm city sanctuary with a plush king bed, curated minibar, and skyline light.',
  },
  {
    roomNumber: '102',
    type: 'Standard',
    pricePerNight: 20000,
    capacity: 2,
    status: 'available',
    amenities: ['Twin Queen Beds', 'Rain Shower', 'Work Desk', 'Mini Bar'],
    description:
      'Thoughtfully zoned for rest and remote work, with a rainfall shower and evening turndown.',
  },
  {
    roomNumber: '201',
    type: 'Deluxe',
    pricePerNight: 32000,
    capacity: 3,
    status: 'available',
    amenities: [
      'Panoramic Balcony',
      'Jacuzzi Tub',
      'Complimentary Breakfast',
      'Espresso Bar',
    ],
    description:
      'Wake to panoramic views, breakfast in bed, and a deep soak in your private jacuzzi.',
  },
  {
    roomNumber: '202',
    type: 'Deluxe',
    pricePerNight: 35000,
    capacity: 3,
    status: 'available',
    amenities: [
      'Ocean/Skyline View',
      'Lounge Area',
      'Butler Call',
      'Smart Climate',
    ],
    description:
      'A generous lounge, ocean-to-skyline outlook, and one-touch butler service.',
  },
  {
    roomNumber: '301',
    type: 'Suite',
    pricePerNight: 55000,
    capacity: 4,
    status: 'available',
    amenities: [
      'Separate Living Room',
      'Private Dining',
      '24/7 Butler',
      'Airport Transfer',
    ],
    description:
      'A residential-style suite with private dining, dedicated butler, and chauffeured arrivals.',
  },
  {
    roomNumber: '401',
    type: 'Presidential',
    pricePerNight: 95000,
    capacity: 6,
    status: 'available',
    amenities: [
      'Private Terrace',
      'Infinity Plunge Pool',
      'Personal Chef',
      'Chauffeur Service',
    ],
    description:
      'The hotel’s crowning residence: private terrace, infinity plunge pool, chef, and chauffeur.',
  },
]

async function seed() {
  const uri = process.env.MONGO_URI

  if (!uri) {
    throw new Error(
      'MONGO_URI is not defined. Copy server/.env.example to server/.env first.',
    )
  }

  await mongoose.connect(uri)
  console.log(`[seed] Connected to ${mongoose.connection.name}`)

  let inserted = 0

  for (const room of rooms) {
    const result = await Room.updateOne(
      { roomNumber: room.roomNumber },
      { $setOnInsert: room },
      { upsert: true, runValidators: true },
    )

    if (result.upsertedCount > 0) {
      inserted += 1
      console.log(`[seed] Created ${room.roomNumber} — ${room.type}`)
    } else {
      console.log(`[seed] ${room.roomNumber} already exists — skipped`)
    }
  }

  console.log(
    `[seed] Done. ${inserted} inserted, ${rooms.length - inserted} already present.`,
  )
}

try {
  await seed()
} catch (error) {
  console.error(`[seed] Failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
