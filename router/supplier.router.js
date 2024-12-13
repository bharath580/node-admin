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
    { name: "id_proof_image", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const body=JSON.parse(req.body.data)
      const files=req.files
      console.log("body",body)
      console.log("file",files)
      
      let data = {
        supplier_name: body.data.supplier_name || '',
        address: body.data.address || '',
        age: body.data.age || '',
        phone: body.data.phone || '',
        id_proof_type: body.data.id_proof_type || '',
        id_proof_number: body.data.id_proof_number || '',
        bank_account_number: body.data.bank_account_number || '',
        supplier_signature: body.supplierSignature || '',
        supplier_image:req.files["supplier_image"][0] ?`images/${req.files["supplier_image"][0].filename}`:'',
        id_proof_image: req.files["id_proof_image"][0] ?`images/${req.files["id_proof_image"][0].filename}`: '',
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
