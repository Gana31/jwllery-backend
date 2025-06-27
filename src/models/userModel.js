import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Name is required"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "user","Manager"],
        message: "Role must be either 'admin' or 'user'",
      },
      default: "worker",
    },
    isActive: {
      type: Boolean,
      default: false, // All new users are inactive by default
    },
    token: {
      value: String,
      expiresAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically create the default admin user if not present
UserSchema.statics.ensureAdminUser = async function () {
  const User = this;
  const adminUser = await User.findOne({ username: "admin" });
  if (!adminUser) {
    const hashedPassword = await bcrypt.hash("admin", 10);
    await User.create({
      fullName: "admin",
      username: "admin",
      password: hashedPassword,
      role: "admin",
       isActive: true, // Default admin is active
    });
  }
};

// Pre-save hook to ensure createdAt/updatedAt are in IST
UserSchema.pre('save', function(next) {
  const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  if (!this.createdAt) this.createdAt = nowIST;
  this.updatedAt = nowIST;
  next();
});

const UserModel = mongoose.model("User", UserSchema);

export default UserModel;
