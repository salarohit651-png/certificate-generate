import mongoose from "mongoose"

export interface AccessLink {
  _id?: string
  token: string
  registrationNumber: string
  isUsed: boolean
  usedAt?: Date
  createdAt: Date
  expiresAt: Date
}

const accessLinkSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  registrationNumber: { type: String, required: true },
  isUsed: { type: Boolean, default: false },
  usedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
})

const AccessLinkModel = mongoose.models?.AccessLink || mongoose.model<AccessLink>("AccessLink", accessLinkSchema)

export default AccessLinkModel
