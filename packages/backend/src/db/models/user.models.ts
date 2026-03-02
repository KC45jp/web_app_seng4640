import mongoose from 'mongoose';
export const newUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, required: true, enum: ["customer", "manager"] },
    passwordHash: { type: String, required: true },
  },
  {
    timestamps: true,
  }
)

export const newUserModel =
    mongoose.models.User ?? mongoose.model("User", newUserSchema, "users");
