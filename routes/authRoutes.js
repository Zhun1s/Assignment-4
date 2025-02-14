const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const User = require("../models/User");

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Register route (GET)
router.get("/register", (req, res) => {
  res.render("register", { title: "Register", user: req.session.user || null });
});

// Handle registration form submission (POST)
router.post("/register", upload.single('profilePicture'), async (req, res) => {
  const { username, password } = req.body;
  const profilePicture = req.file ? req.file.path : null;

  // Check if the username already exists in the database
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.send("Username is already taken"); // Inform the user if the username already exists
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a new user and save to the database
  const user = new User({ username, password: hashedPassword, role: 'user', profilePicture });
  try {
    await user.save(); // Save the user to the database
    res.redirect("/auth/login"); // Redirect to the login page after successful registration
  } catch (err) {
    console.error(err);
    res.send("An error occurred while registering the user");
  }
});

// Login route (GET)
router.get("/login", (req, res) => {
  res.render("login", { title: "Login", user: req.session.user || null });
});

// Handle login form submission (POST)
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (user) {
    if (user.isLocked) {
      return res.render("login", { title: "Login", user: null, error: "Account is locked due to too many failed login attempts" });
    }

    if (await bcrypt.compare(password, user.password)) {
      user.failedLoginAttempts = 0;
      await user.save();
      req.session.user = user; // Store user in session
      res.redirect("/"); // Redirect after successful login
    } else {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.isLocked = true;
      }
      await user.save();
      res.render("login", { title: "Login", user: null, error: "Invalid username or password" });
    }
  } else {
    res.render("login", { title: "Login", user: null, error: "Invalid username or password" });
  }
});

// Logout route
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/"); // Redirect to homepage after logout
  });
});

module.exports = router;