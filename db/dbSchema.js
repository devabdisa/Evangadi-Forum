const dbConnection = require("./dbConfig");

const createTables = async (req, res) => {
  const user_table = `CREATE TABLE IF NOT EXISTS userTable (
    user_id INT(30) AUTO_INCREMENT,
    user_name VARCHAR(50) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL,
    resetToken VARCHAR(255) DEFAULT NULL,
    resetTokenExpire DATETIME DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
  )`;

  const question_table = `CREATE TABLE IF NOT EXISTS questionTable (
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    question_description TEXT NOT NULL,
    tag VARCHAR(40),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES userTable(user_id) ON DELETE CASCADE
  )`;

  const answer_table = `CREATE TABLE IF NOT EXISTS answerTable (
    answer_id INT(30) NOT NULL AUTO_INCREMENT,
    user_id INT(30) NOT NULL,
    question_id INT(30) NOT NULL,
    answer VARCHAR(300) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (answer_id),
    FOREIGN KEY (user_id) REFERENCES userTable(user_id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questionTable(question_id) ON DELETE CASCADE
  )`;

  try {
    await dbConnection.query(user_table);
    console.log("Users Table created successfully");

    await dbConnection.query(question_table);
    console.log("Questions Table created successfully");

    await dbConnection.query(answer_table);
    console.log("Answers Table created successfully");

    res.end("Evangadi Form Table is Successfully created");
  } catch (err) {
    console.error("Error creating tables:", err.message);
    res.status(500).end("Error creating tables: " + err.message);
  }
};

module.exports = createTables;
