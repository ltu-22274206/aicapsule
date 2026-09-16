const express = require("express");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");

const router = express.Router();

// step 1: send the browser to github to approve the app
router.get("/github", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    scope: "read:user",
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

// step 2: github redirects back here with a one-time code
router.get("/github/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("missing oauth code from github");
  }

  try {
    // exchange the code for a github access token
    const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
      }),
    });
    const tokenData = await tokenResp.json();

    if (!tokenData.access_token) {
      console.error("github token exchange failed:", tokenData);
      return res.status(401).send("github oauth failed");
    }

    // use the github access token ONCE, just to identify the user
    const userResp = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "ai-capsule-app",
      },
    });
    const githubUser = await userResp.json();

    if (!githubUser || !githubUser.id) {
      return res.status(401).send("could not fetch github user profile");
    }

    // this is OUR application jwt, not the github token. this is what
    // protects /api/capsules from here on.
    const appToken = jwt.sign(
      { sub: String(githubUser.id), login: githubUser.login },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", appToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect("/dashboard");
  } catch (err) {
    console.error("oauth callback error:", err);
    res.status(500).send("oauth callback error");
  }
});

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

// lets the frontend check "am I logged in" without exposing the jwt itself
router.get("/me", (req, res) => {
  const token = req.cookies && req.cookies.token;
  if (!token) return res.status(401).json({ loggedIn: false });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ loggedIn: true, login: payload.login });
  } catch {
    res.status(401).json({ loggedIn: false });
  }
});

module.exports = router;
