// Import database connection
const db = require("../db/dbConfig");

// status codes for clean responses
const { StatusCodes } = require("http-status-codes");

//Controller: Get all answers for a specific question
const getAnswersByQuestion = async (req, res) => {
  const { questionId } = req.params; 

  try {
    // Fetch answers with username and created date
    const [answers] = await db.query(
      `SELECT answers.answer_id, 
              answers.answer AS content, 
              users.username AS author, 
              answers.created_at
       FROM answers
       JOIN users ON answers.userid = users.userid
       WHERE answers.questionid = ?`,
      [questionId]
    );

    // If no answers found
    if (answers.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "Not Found",
        message: "No answers found for this question",
      });
    }

    // Success response
    return res.status(StatusCodes.OK).json({ answers });
  } catch (err) {
    console.error("Database error while fetching answers:", err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Internal Server Error",
      message: "Something went wrong while getting answers",
    });
  }
};

//Post a new answer for a question

const createAnswer = async (req, res) => {
  const { questionId, answerText } = req.body; // from request body
  const { id: userId } = req.loggedInUser; // from decoded JWT

  // Validation
  if (!questionId || !answerText) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: "Bad Request",
      message: "Question ID and Answer text are required",
    });
  }

  try {
    // Insert into DB
    await db.query(
      `INSERT INTO answers (questionid, userid, answer, created_at)
       VALUES (?, ?, ?, NOW())`,
      [questionId, userId, answerText]
    );

    // Success response
    return res.status(StatusCodes.CREATED).json({
      message: "Answer posted successfully",
    });
  } catch (err) {
    console.error("Database error while posting answer:", err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Internal Server Error",
      message: "Something went wrong while posting your answer",
    });
  }
};

// Export controllers for routes to use
module.exports = { getAnswersByQuestion, createAnswer };
