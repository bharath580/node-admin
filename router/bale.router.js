const express = require("express");
const db = require("../config/database.config");
const baleModel = require("../model/bale.model");
const router = express.Router();
router.get("/baleMaterial", async (req, res) => {
  try {
    const result={};
    const query1 = "SELECT * FROM baling_material"
    const query2 = "SELECT * FROM operators"
     result.balingMaterial = await baleModel.executeQuery(query1);
     result.operators = await baleModel.executeQuery(query2);
    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});
router.get("/baleDropdownList", async (req, res) => {
  try {
    const query = `SELECT concat(codes.code,batches_details.batch_id) as batch_id,batches_details.batch_id as id
FROM batches_details 
join codes on codes.code='BAT'
left join bales_details on bales_details.batch_id=batches_details.batch_id
where bales_details.batch_id is null
GROUP BY batches_details.batch_id`
    const result = await baleModel.executeQuery(query);
    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});
router.get("/", async (req, res) => {
  try {
    const query = `SELECT CONCAT(codes.code,bales.bale_id) AS display_bale_id,bales.*, baling_material.name as bale_material_name,
     CONCAT(
        MONTHNAME(bales.created_on),
        ' ',
        DAY(bales.created_on)
    ) AS date,DATE_FORMAT(bales.created_on, '%H:%i') AS time
     FROM bales
    JOIN codes ON codes.name='Bale' join baling_material on bales.bale_material = baling_material.id
    ORDER BY
bales.bale_id desc`;
    const result = await baleModel.executeQuery(query);
    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});
router.get("/:id", async (req, res) => {
  const {id}=req.params
  try {
    
    const result={}
    const sql = `SELECT bales.bale_id,SUM(bales_details.quantity) AS bale_quantity,CONCAT(codes.code,bales.bale_id) AS display_bale_id,bales.operator_signature AS operator_signature,bales.bale_material,DATE_FORMAT(bales.created_on, '%d/%m/%Y') AS date,DATE_FORMAT(bales.created_on, '%H:%i') AS time,bales.sold,baling_material.name as bale_material_name FROM bales JOIN bales_details ON bales_details.bale_id = bales.bale_id
    JOIN codes ON codes.name='Bale' join baling_material on bales.bale_material = baling_material.id
    WHERE bales.bale_id=${id}`;
    const sql1 = `SELECT bales_details.batch_id,bales_details.quantity,CONCAT(codes.code,bales_details.batch_id) AS display_batch_id FROM bales
    JOIN bales_details ON bales_details.bale_id=bales.bale_id
    JOIN codes ON codes.name='Batches'
    WHERE bales.bale_id=${id}`
     result.summary = await baleModel.executeQuery(sql);
     result.material = await baleModel.executeQuery(sql1);
    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});
router.post("/postData",async (req, res) => {
  console.log("bale post")

  try {
    
    // console.log('get data',req.body)
    const data =req.body
    const {operator,baleMaterial,batchMaterial,baleQuantity,operatorSignature,supervisorSignature}=data

    console.log("operatorSignature",operatorSignature)
    console.log("supervisorSignature",supervisorSignature)
    
    // const supplier_id =purchaseDetail.supplier_id;
    const bale_material = baleMaterial || '';
    const bale_quantity = baleQuantity || '';
    const bale_operator = operator || '';
    const operator_signature=operatorSignature || '';
    const supervisor_signature=supervisorSignature || '';

 
    // console.log('supplier_signature',supplier_signature)
    // const supervisor_signature = supervisorSignature || '';
    // console.log('driver_signature',driver_signature)
    // console.log('supervisor_signature',supervisor_signature)

    const material = batchMaterial;
    let baleCreateQuery = `INSERT INTO bales(
        bale_material,
        bale_quantity,
        bale_operator,
        operator_signature,
        supervisor_signature
        )
        VALUES (?, ?, ?,?,?)`;

    const result = await baleModel.executeQuery(baleCreateQuery, [
      bale_material,
      bale_quantity,
      bale_operator,
      operator_signature,
      supervisor_signature
      
    ]);
    
    if (result.insertId) {
      const bale_id = result.insertId;

      console.log("getting id", bale_id);
      let baleMaterialQuery = `INSERT INTO 
      bales_details(bale_id, batch_id, quantity)
      VALUES (?,?,?)`;
      const materialsInsertPromises = material.map((mat) =>
        baleModel.executeQuery(baleMaterialQuery, [
          bale_id,
          mat.batchId,
          mat.quantity,
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
