const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const answerController = require("../conteroller/answerConteroller");

// Create a new answer (protected route)
router.post("/", authMiddleware, answerController.createAnswer);

// Get all answers (public route)
router.get("/", answerController.getAllAnswers);

// Get all answers for a question (public route)
router.get("/:id", answerController.getAnswersByQuestionId);

module.exports = router;