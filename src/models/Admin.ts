import mongoose, { Document, Schema } from 'mongoose';

export interface IAdmin extends Document {
  username: string;
  password: string;
  email: string;
  role: 'admin' | 'superadmin';
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' }
  },
  { timestamps: true }
);

export default mongoose.model<IAdmin>('Admin', AdminSchema);
