const express = require("express");
const db = require("../config/database.config");
const purchaseModel = require("../model/purchase.model");
const router = express.Router();
//////////////////
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
//upload
router.post("/uploadImage",upload.single('photo'), async (req, res) => {
  console.log("upload")

  console.log("file",req.file)
  console.log("body",req.body.name)
return
  try {
    const sql='SELECT purchase_material_id,material_name FROM purchase_materials'
    const result = await purchaseModel.executeQuery(sql);
    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});
/////////////////


//purchase material list
router.get("/purchaseMaterial", async (req, res) => {
  
  try {
    const sql='SELECT purchase_material_id,material_name FROM purchase_materials'
    const result = await purchaseModel.executeQuery(sql);
    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});
router.get("/getDetailsForNewPurchase", async (req, res) => {
  const result={}
  
  try {
    const supplier='SELECT supplier_id,supplier_name FROM suppliers'
    const driver ='SELECT driver_id,driver_name FROM drivers'
    const vehicle ='SELECT vehicle_id,vehicle_number FROM vehicles'
    const material ='SELECT purchase_material_id,material_name FROM purchase_materials'
    result.supplier = await purchaseModel.executeQuery(supplier);
    result.driver = await purchaseModel.executeQuery(driver);
    result.vehicle = await purchaseModel.executeQuery(vehicle);
    result.material = await purchaseModel.executeQuery(material);
    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await purchaseModel.getById(id);
    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});
router.post("/",upload.single('photo'), async (req, res) => {
  console.log("Purchase post")

  try {
    console.log(JSON.parse(req.body.data))
    // console.log("req",req.body)
    console.log("req",req.file)
    let data=JSON.parse(req.body.data)
    // const data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
    // console.log("reqData",data)

    const {purchaseDetail,materials,driverSignature,supervisorSignature,supplierSignature}=data

    // console.log("purchaseDetails",purchaseDetail)
    
    // const supplier_id =purchaseDetail.supplier_id;
    const supplier_id = purchaseDetail?.supplierId || 4;
    const supervisor_id = purchaseDetail?.supervisor_id || 1;
    const procurement_mode = purchaseDetail?.procurementMode;
    const startMeterReading=purchaseDetail?.startMeterReading || null;
    const endMeterReading=purchaseDetail?.endMeterReading || null;

    let supplier_signature;
    if(procurement_mode=='1'){
       supplier_signature =req.file ? `images/${req.file.filename}` : null;
    }
    else if(procurement_mode=='2'){
       supplier_signature = supplierSignature || null;

    }

    // console.log('supplier_signature',supplier_signature)
    
    const driver_signature = driverSignature || '';
    const supervisor_signature = supervisorSignature || '';
    // console.log('driver_signature',driver_signature)
    // console.log('supervisor_signature',supervisor_signature)

    const material = materials;
    let purchaseCreateQuery = `INSERT INTO purchase_order(
        supplier_id,
        supervisor_id,
        procurement_mode,
        supervisor_signature,
        driver_signature,
        supplier_signature
        )
        VALUES (?, ?, ?,?,?,?)`;

    const result = await purchaseModel.executeQuery(purchaseCreateQuery, [
      supplier_id,
      supervisor_id,
      procurement_mode,
      supervisor_signature,
      driver_signature,
      supplier_signature
    ]);
    
    if (result.insertId) {
      const po_id = result.insertId;

      console.log("getting id", po_id);
      let purchaseMaterialQuery = `INSERT INTO 
      purchase_order_details(po_id, purchase_material_id, quantity, sacks)
      VALUES (?,?,?,?)`;
      const materialsInsertPromises = material.map((mat) =>
        purchaseModel.executeQuery(purchaseMaterialQuery, [
          po_id,
          mat.material,
          mat.quantity,
          mat.sacks,
        ])
      );
      const materials = await Promise.all(materialsInsertPromises);
      res.json(materials);
    } else {
      res.json(result);
    }
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});


router.get("/", async (req, res) => {
  console.log("Purchase get")
  try {
    const result = await purchaseModel.getAll();
    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});
module.exports = router;
