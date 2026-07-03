const express = require("express");
const session = require("express-session");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

app.use(session({
  secret: "brp-secret",
  resave: false,
  saveUninitialized: false
}));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/login", (req, res) => {
  const url =
    `https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}` +
    `&scope=identify`;

  res.redirect(url);
});

app.get("/callback", async (req, res) => {
  try {
    const code = req.query.code;

    const token = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.REDIRECT_URI
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const user = await axios.get("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${token.data.access_token}`
      }
    });

    req.session.user = user.data;

    res.redirect("/dashboard.html");
  } catch (err) {
    console.log(err.response?.data || err.message);
    res.send("Login Fehler");
  }
});

app.get("/api/user", (req, res) => {
  res.json(req.session.user || null);
});

app.listen(PORT, () => {
  console.log("BRP läuft auf Port " + PORT);
});
