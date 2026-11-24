import Feedback from '../models/Feedback.js'

const STAFF_ROLES = ['admin', 'manager', 'receptionist']

export async function getFeedback(req, res) {
  try {
    const isStaff = STAFF_ROLES.includes(req.user.role)
    const filter = isStaff ? {} : { guest: req.user.id }

    const feedback = await Feedback.find(filter)
      .populate({ path: 'guest', select: 'name' })
      .sort({ createdAt: -1 })

    if (isStaff) {
      const totalRating = feedback.reduce((sum, f) => sum + f.rating, 0)
      const averageRating = feedback.length ? totalRating / feedback.length : 0
      return res.status(200).json({ success: true, feedback, averageRating })
    }

    return res.status(200).json({ success: true, feedback })
  } catch (error) {
    console.error('[feedback] getAll:', error)
    return res.status(500).json({ success: false, message: 'Unable to load feedback' })
  }
}

export async function createFeedback(req, res) {
  try {
    const { rating, comment } = req.body ?? {}

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: 'Rating and comment are required' })
    }

    const entry = await Feedback.create({
      guest: req.user.id,
      rating: Number(rating),
      comment,
    })

    const populated = await entry.populate({ path: 'guest', select: 'name' })
    return res.status(201).json({ success: true, feedback: populated })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0].message,
      })
    }
    console.error('[feedback] create:', error)
    return res.status(500).json({ success: false, message: 'Unable to submit feedback' })
  }
}
