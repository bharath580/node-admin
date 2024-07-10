const express = require("express");
const db = require("../config/database.config");
const jwt = require("jsonwebtoken");
const secretKey = "abcd";
const authModel = require("../model/auth.model");
const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const body = req.body;
    console.log(body);
    const checkUserNameQuery = `SELECT * FROM admin_user WHERE user_name=?`;
    const checkExistingUser = await authModel.executeQuery(checkUserNameQuery, [
      body.user_name,
    ]);

    if (checkExistingUser.length > 0) {
      return res.send("Username already exist");
    }

    const token = await generateToken(body);

    const result = await authModel.create(token);

    res.json(
      result.insertId ? await authModel.getById(result.insertId) : result
    );
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});

router.post("/login", async (req, res) => {
  try {
    const { user_name, user_password } = req.body;
    const selectLoginQuery =
      "SELECT * FROM admin_user WHERE user_name=? AND user_password=?";
    const user = await authModel.executeQuery(selectLoginQuery, [
      user_name,
      user_password,
    ]);
    console.log("user", user);
    if (user.length > 0) {
      const tokenGenerate = await generateToken(user[0]);
      const tokenUpdateQuery = `UPDATE admin_user SET access_token=? WHERE user_name=? AND user_password=?`;
      const tokenUpdate = await authModel.executeQuery(tokenUpdateQuery, [
        tokenGenerate.token,
        tokenGenerate.user_name,
        tokenGenerate.user_password,
      ]);
      const result = await authModel.getById(user[0].id);
      res.json(result);
    } else {
      res.status(404).send("No user found");
    }
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});

const generateToken = async (user) => {
  console.log("generated", user);
  const userData = {
    name: user.name,
    user_name: user.user_name,
    user_password: user.user_password,
    role: user.role,
  };

  // Create a token with a payload (user data) and a secret key
  const token = jwt.sign(userData, secretKey, { expiresIn: "1d" });

  userData.token = token;
  console.log("userdata", userData);
  return userData;
};
module.exports = router;
