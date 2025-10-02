const dbConnection = require("../db/dbConfig");

async function createAnswer(req, res) {
  const { answer, questionid } = req.body;
  const userid = req.user.userid; // Get user ID from auth middleware

  if (!answer || !questionid) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Please provide both answer and questionid"
    });
  }

  try {
    // First check if the question exists
    const [questions] = await dbConnection.promise().execute(
      "SELECT questionid FROM questions WHERE questionid = ?",
      [questionid]
    );

    if (!questions || questions.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "Question not found"
      });
    }

    // Create the answer
    const [result] = await dbConnection.promise().execute(
      "INSERT INTO answers (userid, questionid, answer) VALUES (?, ?, ?)",
      [userid, questionid, answer]
    );

    res.status(201).json({
      message: "Answer created successfully",
      answerid: result.insertId
    });

  } catch (error) {
    console.error("Create answer error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Something went wrong while creating the answer"
    });
  }
}

async function getAllAnswers(req, res) {
  try {
    const [answers] = await dbConnection.promise().execute(
      `SELECT a.answerid, a.answer, u.username, u.firstname, u.lastname, q.title as question_title
       FROM answers a
       JOIN users u ON a.userid = u.userid
       JOIN questions q ON a.questionid = q.questionid
       ORDER BY a.answerid DESC`
    );

    res.status(200).json({
      message: "Answers retrieved successfully",
      answers
    });

  } catch (error) {
    console.error("Get answers error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Something went wrong while retrieving answers"
    });
  }
}

async function getAnswersByQuestionId(req, res) {
  const { id } = req.params;

  try {
    const [answers] = await dbConnection.promise().execute(
      `SELECT a.answerid, a.answer, u.username, u.firstname, u.lastname
       FROM answers a
       JOIN users u ON a.userid = u.userid
       WHERE a.questionid = ?
       ORDER BY a.answerid DESC`,
      [id]
    );

    res.status(200).json({
      message: "Answers retrieved successfully",
      answers
    });

  } catch (error) {
    console.error("Get answers by question id error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Something went wrong while retrieving answers"
    });
  }
}

module.exports = {
  createAnswer,
  getAllAnswers,
  getAnswersByQuestionId
};
