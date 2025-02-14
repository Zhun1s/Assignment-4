require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const MongoDBStore = require('connect-mongodb-session')(session);

const app = express();

// Database Connection
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use('/uploads', express.static('uploads')); // Serve static files from the uploads directory
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false}
  })
);
app.set("view engine", "ejs");

// Routes
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
  res.render("index", { user: req.session.user });
});

app.get("/auth/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/"); // Redirect to home if already logged in
  }
  res.render("login", { title: "Login" });
});

app.post("/auth/login", async (req, res) => {
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

app.get("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/"); // Redirect to homepage after logout
  });
});

app.post("/auth/register", async (req, res) => {
  const { username, password } = req.body;
  
  // Check if username already exists
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.send("Username already taken");
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user and save
  const user = new User({ username, password: hashedPassword });
  try {
    await user.save(); // Save to DB
    res.redirect("/auth/login"); // Redirect after successful registration
  } catch (err) {
    console.error(err);
    res.send("An error occurred during registration.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));