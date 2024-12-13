const express = require("express");
const db = require("../config/database.config");
const buyerModel = require("../model/buyer.model");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../public/images"), // Set the destination folder
  filename: (req, file, cb) => {
    return cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage: storage,
});

router.get("/", async (req, res) => {
  try {
    const result = await buyerModel.getAll();
    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});
//create
router.post(
  "/",
  upload.fields([
    { name: "buyer_image", maxCount: 1 },
    { name: "buyer_id_proof_image", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const body=JSON.parse(req.body.data)
      const files=req.files
      console.log("body",body)
      console.log("file",files)
      let data = {
        buyer_name: body.data.buyer_name || '',
        address: body.data.address || '',
        age: body.data.age || '',
        phone: body.data.phone || '',
        id_proof_type: body.data.id_proof_type || '',
        id_proof_number: body.data.id_proof_number || '',
        bank_account_number: body.data.bank_account_number || '',
        buyer_signature: body.buyerSignature || '',
        buyer_image: req.files["buyer_image"] && req.files["buyer_image"][0] 
        ? `images/${req.files["buyer_image"][0].filename}` 
        : '',
      id_proof_image: req.files["buyer_id_proof_image"] && req.files["buyer_id_proof_image"][0]
        ? `images/${req.files["buyer_id_proof_image"][0].filename}`
        : '',
      
      };
      console.log("data", data);

      const result = await buyerModel.create(data);
      res.json(result);
    } catch (e) {
      console.error("Error:", e);
      res.status(500).send("Error");
    }
  }
);

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const sql = `SELECT * FROM buyer WHERE buyer_id=${id}`
    const result = await buyerModel.executeQuery(sql);
    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});
module.exports = router;
