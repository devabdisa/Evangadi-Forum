const express = require("express");
const router = express.Router();

const {
  createAnswer,
  getAnswersByQuestion,
} = require("../controller/answerController");

const verifyUserToken = require("../middleware/authMiddleware");

// Get all answers for a given question
router.get("/answer/:questionId", getAnswersByQuestion);

// Post a new answer (only for logged-in users)
router.post("/answer", verifyUserToken, createAnswer);

module.exports = router;
