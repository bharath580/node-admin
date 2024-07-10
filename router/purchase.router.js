const express = require("express");
const db = require("../config/database.config");
const purchaseModel = require("../model/purchase.model");
const router = express.Router();

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
router.post("/", async (req, res) => {
  try {
    console.log(req.body)
    const {purchaseDetail,materials}=req.body

    // console.log("purchaseDetails",purchaseDetail)
    
    // const supplier_id =purchaseDetail.supplier_id;
    const supplier_id = purchaseDetail.supplierId;
    const supervisor_id = purchaseDetail.supervisor_id || 1;
    const procurement_mode = purchaseDetail.procurementMode;
    const startMeterReading=purchaseDetail.startMeterReading || null;
    const endMeterReading=purchaseDetail.endMeterReading || null;
    const supplier_signature = req.body.supplierSignature || '';
    const driver_signature = req.body.driverSignature || '';
    // const supervisor_signature = req.body.supervisor_signature;
    const material = materials;
    let purchaseCreateQuery = `INSERT INTO purchase_order(
        supplier_id,
        supervisor_id,
        procurement_mode,
        supplier_signature,
        driver_signature
        )
        VALUES (?, ?, ?,?,?)`;

    const result = await purchaseModel.executeQuery(purchaseCreateQuery, [
      supplier_id,
      supervisor_id,
      procurement_mode,
      supplier_signature,
      driver_signature,
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
module.exports = router;
