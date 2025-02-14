const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Middleware to check if the user is an admin
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    console.log("Admin authenticated");
    next();
  } else {
    console.log("Admin authentication failed");
    res.redirect("/auth/login");
  }
}

// Admin dashboard (GET)
router.get("/dashboard", isAdmin, async (req, res) => {
  console.log("Admin dashboard route hit");
  const users = await User.find();
  res.render("adminDashboard", { title: "Admin Dashboard", user: req.session.user, users });
});

// Edit user (GET)
router.get("/edit/:id", isAdmin, async (req, res) => {
  console.log("Edit user route hit");
  const user = await User.findById(req.params.id);
  res.render("editUser", { title: "Edit User", user: req.session.user, editUser: user });
});

// Edit user (POST)
router.post("/edit/:id", isAdmin, async (req, res) => {
  console.log("Edit user POST route hit");
  const { username, role } = req.body;
  await User.findByIdAndUpdate(req.params.id, { username, role });
  res.redirect("/admin/dashboard");
});

// Delete user (POST)
router.post("/delete/:id", isAdmin, async (req, res) => {
  console.log("Delete user POST route hit");
  await User.findByIdAndDelete(req.params.id);
  res.redirect("/admin/dashboard");
});

module.exports = router;