import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    securityPin: {
      type: String,
      required: false, // Optional to support legacy accounts
    },
    avatar: {
      type: String,
      default: "",
    },
    statusMessage: {
      type: String,
      default: "Available",
      trim: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    soundEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export interface IUserDocument {
  _id: any;
  name: string;
  email: string;
  password: string;
  securityPin?: string;
  avatar?: string;
  statusMessage?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  soundEnabled?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Mongoose model caching to prevent re-compilation on hot-reload
const User = (models.User || model<IUserDocument>("User", UserSchema)) as mongoose.Model<IUserDocument>;

export default User;
