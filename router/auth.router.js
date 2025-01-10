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
      const result = await authModel.getByAdminId(user[0].id);
      console.log('result',result)
    
      res.json(result);
    } else {
      res.status(404).send("No user found");
    }
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});

router.post("/loginForMobile", async (req, res) => {
  console.log("Login request received");
  try {
    const { user_name, user_password } = req.body;

    // Input validation
    if (!user_name || !user_password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Query to check user credentials
    const selectLoginQuery = 
      "SELECT * FROM supervisors WHERE user_name=? AND password=?";
    const user = await authModel.executeQuery(selectLoginQuery, [
      user_name,
      user_password,
    ]);
    console.log("User found:", user);

    if (user.length > 0) {
      // Generate token
      const tokenGenerate = await generateTokenForMobile(user[0]);
      if (!tokenGenerate || !tokenGenerate.token) {
        throw new Error("Token generation failed");
      }
      console.log("tokenGenerate",tokenGenerate.token,'user[0].id',user[0].supervisor_id)
      // Update token in the database
      const tokenUpdateQuery = 
        `UPDATE supervisors SET access_token=? WHERE supervisor_id=?`;
      await authModel.executeQuery(tokenUpdateQuery, [
        tokenGenerate.token,
        user[0].supervisor_id, // Use ID instead of user_name/password for security
      ]);

      // Get updated user data
      const result = await authModel.getById(user[0].supervisor_id);
      res.json(result);
    } else {
      res.status(404).json({ error: "No user found" });
    }
  } catch (e) {
    console.error("Error during login:", e);
    res.status(500).send("Internal server error");
  }
});

const generateTokenForMobile = async (user) => {
  console.log("generated", user);
  const userData = {
    name: user.supervisor_name,
    user_name: user.user_name,
    user_password: user.password,
    role: user.role,
  };

  // Create a token with a payload (user data) and a secret key
  const token = jwt.sign(userData, secretKey);

  userData.token = token;
  console.log("userdata", userData);
  return userData;
};
const generateToken = async (user) => {
  console.log("generated", user);
  const userData = {
    name: user.name,
    user_name: user.user_name,
    user_password: user.user_password,
    role: user.role,
  };

  // Create a token with a payload (user data) and a secret key
  const token = jwt.sign(userData, secretKey);

  userData.token = token;
  console.log("userdata", userData);
  return userData;
};
module.exports = router;
