const express = require("express");
const db = require("../config/database.config");
const batchModel = require("../model/batches.model");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const query = `SELECT CONCAT(c1.code, b1.batch_id) AS display_batch_id,b1.batch_id,
    b1.status,SUM(pd1.quantity) AS totalQuantity,bd1.batch_id,bd1.material_id, (SELECT MAX(DATE_FORMAT(s2.created_on, '%d/%m/%Y'))
            FROM segregation s2
            WHERE s2.batch_id=b1.batch_id) AS end_date,
            (SELECT MIN(DATE_FORMAT(s2.created_on, '%d/%m/%Y')) FROM segregation s2 
            WHERE s2.batch_id=b1.batch_id) AS start_date, 
             CONCAT(
        MONTHNAME(b1.created_on),
        ' ',
        DAY(b1.created_on)
    ) AS date,DATE_FORMAT(b1.created_on, '%H:%i') AS time
            FROM purchase_order p1
            JOIN purchase_order_details pd1 ON pd1.po_id = p1.po_id 
            JOIN batches_details bd1 ON bd1.purchase_order_id = pd1.po_id AND bd1.material_id = pd1.purchase_material_id
            JOIN batches b1 ON b1.batch_id=bd1.batch_id
            JOIN
    codes c1 ON c1.name='Batches'
            GROUP BY b1.batch_id
            ORDER BY
b1.batch_id desc`;
    const result = await batchModel.executeQuery(query);
    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});
router.get("/batchdetail/:id", async (req, res) => {
  try {
    const result={}
    const id = req.params.id;
    const sql=`SELECT batches.batch_id,batches.status as status,CONCAT(codes.code,batches.batch_id) AS display_batch_id,
    DATE_FORMAT(batches.created_on, '%d/%m/%Y') AS date,
     SUM(purchase_order_details.quantity) AS quantity,
     COUNT(purchase_order_details.po_details_id) AS orderCount,
    DATE_FORMAT(batches.created_on, '%H:%i') AS time
    FROM batches JOIN batches_details ON batches_details.batch_id=batches.batch_id 
    JOIN purchase_order_details ON purchase_order_details.purchase_material_id=batches_details.material_id
    AND purchase_order_details.po_id=batches_details.purchase_order_id
    JOIN codes ON codes.name='Batches'
    WHERE batches.batch_id=${id}`
    
    const sql2=`SELECT  CONCAT(purchase_materials.code,batches_details.purchase_order_id) AS display_material_id,
    CONCAT(codes.code,batches_details.purchase_order_id) AS display_order_id,purchase_materials.material_name,batches_details.purchase_order_id,batches_details.material_id,
    purchase_order_details.purchase_material_id,purchase_order_details.quantity,
    purchase_order_details.sacks,purchase_order_details.quantity,suppliers.supplier_name FROM batches 
    JOIN batches_details ON batches.batch_id=batches_details.batch_id 
    JOIN purchase_order_details ON batches_details.material_id=purchase_order_details.purchase_material_id
    AND batches_details.purchase_order_id = purchase_order_details.po_id
    JOIN purchase_order ON purchase_order.po_id=purchase_order_details.po_id
    JOIN suppliers ON suppliers.supplier_id=purchase_order.supplier_id
    JOIN purchase_materials ON batches_details.material_id = purchase_materials.purchase_material_id
    JOIN codes ON codes.name='Purchases'
    WHERE batches.batch_id=${id};`
    
     result.summary = await batchModel.executeQuery(sql)
     result.material=await batchModel.executeQuery(sql2)

    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});
router.get("/materialList", async (req, res) => {
  try {
    const query = `SELECT
    CONCAT(purchase_materials.code, purchase_order_details.po_id) AS display_id,
    purchase_order_details.po_id,
    suppliers.supplier_name,
    purchase_materials.purchase_material_id,
    suppliers.supplier_id,
    CONCAT(
        MONTHNAME(purchase_order.date),
        ' ',
        DAY(purchase_order.date)
    ) AS date
FROM
    purchase_order_details
JOIN purchase_materials 
    ON purchase_order_details.purchase_material_id = purchase_materials.purchase_material_id
JOIN purchase_order 
    ON purchase_order.po_id = purchase_order_details.po_id
JOIN suppliers 
    ON purchase_order.supplier_id = suppliers.supplier_id
LEFT JOIN batches_details 
    ON batches_details.purchase_order_id = purchase_order_details.po_id 
    AND batches_details.material_id = purchase_order_details.purchase_material_id
WHERE
    batches_details.purchase_order_id IS NULL`;
    const result = await batchModel.executeQuery(query);
    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});
router.post("/", async (req, res) => {
  try {
    const body=req.body
    console.log(body)
    // const {purchaseAndMaterial}=req.body[0]
    // console.log(purchaseAndMaterial)
    
  
    // const supervisor_signature = req.body.supervisor_signature;
   
    let batchCreateQuery = `INSERT INTO batches(
        status,
        segregated
        )
        VALUES (?,?)`;

    const result = await batchModel.executeQuery(batchCreateQuery, [
      1,
      0
    ]);
    
    if (result.insertId) {
      const batch_id = result.insertId;

      console.log("getting id", batch_id);
      let batchMaterialQuery = `INSERT INTO 
      batches_details(batch_id, purchase_order_id,material_id)
      VALUES (?,?,?)`;
      const materialsInsertPromises = body.map((mat) =>
        batchModel.executeQuery(batchMaterialQuery, [
          batch_id,
          mat.purchaseAndMaterial.po_id,  
          mat.purchaseAndMaterial.purchase_material_id
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
