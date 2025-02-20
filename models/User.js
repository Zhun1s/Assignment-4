const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  profilePicture: { type: String },
  failedLoginAttempts: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false }
});

module.exports = mongoose.model("User", UserSchema);