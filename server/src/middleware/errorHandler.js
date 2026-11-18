import mongoose from 'mongoose'

import { env } from '../config/env.js'

/**
 * Central error handler. Must be registered last, after all routes.
 * Normalizes Mongoose and application errors into one response shape.
 */
export function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode ?? 500
  let message = error.message ?? 'Internal server error'
  let details = error.details

  if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400
    message = 'Validation failed'
    details = Object.values(error.errors).map((fieldError) => ({
      field: fieldError.path,
      message: fieldError.message,
    }))
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400
    message = `Invalid value for "${error.path}"`
  } else if (error.code === 11000) {
    statusCode = 409
    message = 'A record with that value already exists'
    details = Object.keys(error.keyValue ?? {}).map((field) => ({
      field,
      message: 'Must be unique',
    }))
  }

  if (statusCode >= 500) {
    console.error('[api] unhandled error:', error)
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 && env.isProduction ? 'Internal server error' : message,
    ...(details ? { details } : {}),
    ...(env.isProduction ? {} : { stack: error.stack }),
  })
}
