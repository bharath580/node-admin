const express = require("express");
const db = require("../config/database.config");
const supplierModel = require("../model/supplier.model");
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
    const result = await supplierModel.getAll();
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
    { name: "supplier_image", maxCount: 1 },
    { name: "supplier_signature", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // const body=req.body
      // console.log("body",body)
      let data = {
        supplier_name: req.body.supplier_name,
        address: req.body.address,
        age: req.body.age,
        user_name: req.body.user_name,
        password: req.body.password,
        phone: req.body.phone,
        id_proof_type: req.body.id_proof_type,
        supplier_image: req.files["supplier_image"][0].filename,
        supplier_signature: req.files["supplier_signature"][0].filename,
      };
      console.log("data", data);

      const result = await supplierModel.create(data);
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
    const result = await supplierModel.getById(id);
    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});
module.exports = router;
