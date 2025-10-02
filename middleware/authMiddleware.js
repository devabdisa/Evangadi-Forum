const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");

// Secret key for signing JWT tokens
const JWT_SECRET_KEY = process.env.JWT_SECRET;

const verifyUserToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      error: "Unauthorized",
      message: "Token missing or invalid format",
    });
  }

  // Extract the token part
  const token = authHeader.split(" ")[1];

  try {
    // Verify token
    const decodedToken = jwt.verify(token, JWT_SECRET_KEY);

    // Attach user info to the request object
    req.loggedInUser = {
      id: decodedToken.userid,
      name: decodedToken.username,
    };

    next(); // continue to next function
  } catch (err) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      error: "Unauthorized",
      message: "Token is not valid",
    });
  }
};

module.exports = verifyUserToken;
