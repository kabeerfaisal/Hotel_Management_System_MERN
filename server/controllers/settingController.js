import Setting from '../models/Setting.js'

const EDITABLE_FIELDS = [
  'hotelName',
  'taxRate',
  'checkInTime',
  'checkOutTime',
  'cancellationPolicy',
]

function pickSettingsFields(body = {}) {
  return EDITABLE_FIELDS.reduce((fields, field) => {
    if (body[field] !== undefined) fields[field] = body[field]
    return fields
  }, {})
}

function sendSettingError(res, error, fallbackMessage) {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: Object.values(error.errors)[0].message,
    })
  }

  console.error('[settings]', error)
  return res.status(500).json({ success: false, message: fallbackMessage })
}

/**
 * Settings are a singleton document. Create it with defaults on first read.
 */
async function getSingleton() {
  const existing = await Setting.findOne()

  return existing ?? Setting.create({})
}

export async function getSettings(req, res) {
  try {
    const settings = await getSingleton()

    return res.status(200).json({ success: true, settings })
  } catch (error) {
    return sendSettingError(res, error, 'Unable to load settings')
  }
}

export async function updateSettings(req, res) {
  try {
    const fields = pickSettingsFields(req.body)

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields were provided',
      })
    }

    const settings = await Setting.findOneAndUpdate({}, fields, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    })

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      settings,
    })
  } catch (error) {
    return sendSettingError(res, error, 'Unable to update settings')
  }
}
