import mongoose from 'mongoose'

import Booking from '../models/Booking.js'
import Room from '../models/Room.js'
import ServiceRequest from '../models/ServiceRequest.js'
import User from '../models/User.js'
import {
  emailRow,
  emailShell,
  emailTable,
  referenceBlock,
} from '../utils/emailTemplates.js'
import { formatLabel, formatPKR } from '../utils/format.js'
import { escapeHtml, sendEmail } from '../utils/sendEmail.js'

const STAFF_ROLES = ['admin', 'manager', 'receptionist', 'housekeeping']

const POPULATE = [
  { path: 'room', select: 'roomNumber' },
  { path: 'requestedBy', select: 'name' },
]

function serviceReference(id) {
  return `SR-${String(id).slice(-6).toUpperCase()}`
}

function buildServiceEmail({ heading, intro, request, charge }) {
  return emailShell({
    heading,
    intro,
    content: `
      ${referenceBlock(serviceReference(request._id))}
      ${emailTable([
        emailRow('Service', escapeHtml(formatLabel(request.category))),
        emailRow('Room', escapeHtml(request.room?.roomNumber ?? '—')),
        emailRow('Priority', escapeHtml(formatLabel(request.priority))),
        emailRow('Status', escapeHtml(formatLabel(request.status))),
        emailRow('Charge', formatPKR(charge)),
      ])}
      <div style="margin-top:18px;padding:14px 16px;background:#faf6ec;border:1px solid #eadfc4;border-radius:12px;font-size:13px;line-height:1.6;color:#4b463f;">
        ${escapeHtml(request.description)}
      </div>
    `,
  })
}

async function sendServiceMail({ to, mail, label }) {
  if (!to) return false

  try {
    await sendEmail({ to, ...mail })
    return true
  } catch (error) {
    console.error(`[service-requests] ${label} email failed:`, error.message)
    return false
  }
}

export async function getServiceRequests(req, res) {
  try {
    const filter = STAFF_ROLES.includes(req.user.role) ? {} : { requestedBy: req.user.id }
    const requests = await ServiceRequest.find(filter)
      .populate(POPULATE)
      .sort({ createdAt: -1 })
    return res.status(200).json({ success: true, requests })
  } catch (error) {
    console.error('[service-requests] getAll:', error)
    return res.status(500).json({ success: false, message: 'Unable to load service requests' })
  }
}

export async function createServiceRequest(req, res) {
  try {
    const { category, room, description, priority } = req.body ?? {}

    if (!category || !room || !description) {
      return res
        .status(400)
        .json({ success: false, message: 'Category, room and description are required' })
    }

    // Guests may only request services for a room they currently occupy.
    if (req.user.role === 'guest') {
      if (!mongoose.isValidObjectId(room)) {
        return res.status(400).json({ success: false, message: 'Invalid room id' })
      }

      const hasActiveBooking = await Booking.exists({
        user: req.user.id,
        room,
        status: { $in: ['confirmed', 'checked-in'] },
      })

      if (!hasActiveBooking) {
        return res.status(403).json({
          success: false,
          message: 'You can only request services for your active booked room',
        })
      }
    }

    const request = await ServiceRequest.create({
      category,
      room,
      description,
      priority: priority ?? 'medium',
      requestedBy: req.user.id,
    })

    const populated = await request.populate(POPULATE)

    try {
      const requester = await User.findById(req.user.id).select('email').lean()

      await sendServiceMail({
        to: requester?.email,
        label: 'service request received',
        mail: {
          subject: `Service request ${serviceReference(populated._id)} received — LuxuryStay`,
          html: buildServiceEmail({
            heading: 'Service request received',
            intro: `Dear ${escapeHtml(populated.requestedBy?.name ?? 'Guest')}, our team has received your request and will handle it shortly.`,
            request: populated,
            charge: populated.charge ?? 0,
          }),
          text: `We received your ${formatLabel(populated.category)} request for room ${populated.room?.roomNumber ?? '—'}. Charge: ${formatPKR(populated.charge ?? 0)}.`,
        },
      })
    } catch (error) {
      console.error(
        '[service-requests] service request received email failed:',
        error.message,
      )
    }

    return res.status(201).json({ success: true, request: populated })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0].message,
      })
    }
    console.error('[service-requests] create:', error)
    return res.status(500).json({ success: false, message: 'Unable to create service request' })
  }
}

export async function updateServiceRequest(req, res) {
  try {
    if (!STAFF_ROLES.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    const { status, priority, charge } = req.body ?? {}

    const request = await ServiceRequest.findById(req.params.id)

    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' })
    }

    const previousStatus = request.status

    if (status !== undefined) request.status = status
    if (priority !== undefined) request.priority = priority
    if (charge !== undefined) request.charge = charge

    await request.save()
    await request.populate(POPULATE)

    // Auto-restore room to 'available' when a housekeeping task is completed
    if (request.category === 'housekeeping' && request.status === 'completed') {
      await Room.findOneAndUpdate(
        { _id: request.room?._id ?? request.room, status: 'cleaning' },
        { status: 'available' },
      )
    }

    if (previousStatus !== 'completed' && request.status === 'completed') {
      try {
        const requesterId = request.requestedBy?._id ?? request.requestedBy
        const requester = await User.findById(requesterId)
          .select('name email')
          .lean()

        await sendServiceMail({
          to: requester?.email,
          label: 'service completed',
          mail: {
            subject: `Service request ${serviceReference(request._id)} completed — LuxuryStay`,
            html: buildServiceEmail({
              heading: 'Your service request is complete',
              intro: `Dear ${escapeHtml(request.requestedBy?.name ?? requester?.name ?? 'Guest')}, the service you requested has been completed. Here is the final summary.`,
              request,
              charge: request.charge ?? 0,
            }),
            text: `Your ${formatLabel(request.category)} request for room ${request.room?.roomNumber ?? '—'} is complete. Final charge: ${formatPKR(request.charge ?? 0)}.`,
          },
        })
      } catch (error) {
        console.error(
          '[service-requests] service completed email failed:',
          error.message,
        )
      }
    }

    return res.status(200).json({ success: true, request })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0].message,
      })
    }
    console.error('[service-requests] update:', error)
    return res.status(500).json({ success: false, message: 'Unable to update service request' })
  }
}
