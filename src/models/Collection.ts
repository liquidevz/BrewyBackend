import mongoose, { Document, Schema } from 'mongoose';

export interface ICollection extends Document {
    id: string;
    name: string;
    handle: string;
    description: string;
    productIds: string[];
    image?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CollectionSchema: Schema = new Schema(
    {
        id: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        handle: { type: String, required: true, unique: true },
        description: { type: String, required: true },
        productIds: [{ type: String }],
        image: { type: String }
    },
    { timestamps: true }
);

export default mongoose.model<ICollection>('Collection', CollectionSchema);
