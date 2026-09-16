const jwt = require("jsonwebtoken");

// verifies the application JWT stored in the httpOnly "token" cookie.
// this is what protects every /api/capsules route. no cookie or a bad
// signature -> 401, and we never trust a user_id sent by the client.
function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "not authenticated" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub; // github user id, trusted because it came from our own signed jwt
    req.userLogin = payload.login;
    next();
  } catch (err) {
    return res.status(401).json({ error: "invalid or expired token" });
  }
}

module.exports = { requireAuth };
