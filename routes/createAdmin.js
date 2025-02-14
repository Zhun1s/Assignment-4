require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

// Database Connection
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err));

async function createAdmin() {
  const username = "admin";
  const password = "adminpassword"; // Change this to a secure password
  const role = "admin";

  // Check if the admin user already exists
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    console.log("Admin user already exists");
    return;
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a new admin user
  const adminUser = new User({ username, password: hashedPassword, role });

  try {
    await adminUser.save();
    console.log("Admin user created successfully");
  } catch (err) {
    console.error("Error creating admin user:", err);
  } finally {
    mongoose.connection.close();
  }
}

createAdmin();