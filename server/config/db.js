import mongoose from 'mongoose'

/**
 * Connect to MongoDB using the MONGO_URI environment variable.
 * Throws on failure so the caller can fail fast.
 */
export async function connectDB() {
  const uri = process.env.MONGO_URI

  if (!uri) {
    throw new Error('MONGO_URI is not defined. Copy server/.env.example to server/.env.')
  }

  try {
    const connection = await mongoose.connect(uri)

    console.log(
      `[db] MongoDB connected: ${connection.connection.host}/${connection.connection.name}`,
    )

    return connection
  } catch (error) {
    console.error(`[db] MongoDB connection error: ${error.message}`)
    throw error
  }
}

export default connectDB
