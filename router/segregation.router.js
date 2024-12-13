

const express = require("express");
const db = require("../config/database.config");
const segregationModel = require("../model/segregation.model");
const router = express.Router();

router.get("/batchList", async (req, res) => {
    try {
      const query = `SELECT CONCAT(codes.code,batches.batch_id) AS display_id,
      SUM(purchase_order_details.quantity) AS totalQuantity,
      batches.batch_id AS batch_id,bales_details.bale_id
      FROM batches 
      JOIN batches_details ON batches.batch_id=batches_details.batch_id 
      JOIN purchase_order_details ON purchase_order_details.po_id=batches_details.purchase_order_id AND purchase_order_details.purchase_material_id= batches_details.material_id
      JOIN codes ON codes.name='Batches'
      left join bales_details on bales_details.batch_id = batches.batch_id 
      WHERE batches.status!=3 AND bales_details.batch_id is Null  GROUP BY batches.batch_id`;
      const result = await segregationModel.executeQuery(query);
      res.json(result);
    } catch (e) {
      console.error("Error:", e);
      res.status(500).send("Error");
    }
  });
  router.get("/batch/:id", async (req, res) => {
    const {id}=req.params
    const result={}
    try {
      const query = `SELECT CONCAT(codes.code,purchase_order.po_id) AS display_id,
      purchase_order.po_id AS po_id,purchase_order_details.purchase_material_id FROM batches JOIN batches_details ON batches.batch_id=batches_details.batch_id
      JOIN purchase_order ON purchase_order.po_id=batches_details.purchase_order_id 
      JOIN purchase_order_details ON purchase_order_details.po_id=purchase_order.po_id AND purchase_order_details.purchase_material_id=batches_details.material_id 
      JOIN codes ON codes.name='Purchases'
      WHERE batches.batch_id=${id}`;
      const query2 = `SELECT segregation_material_id,material FROM segregation_material`;
      const query3 = `SELECT segregator_id,name FROM segregators`;
      result.po_material = await segregationModel.executeQuery(query);
      result.segregation_material = await segregationModel.executeQuery(query2);
      result.segregators = await segregationModel.executeQuery(query3);
      res.json(result);
    } catch (e) {
      console.error("Error:", e);
      res.status(500).send("Error");
    }
  });

  router.post("/batch", async (req, res) => {
    try {
      const body=req.body
      console.log(body)
      let segregationCreateQuery = `INSERT INTO segregation(
          batch_id,
          po_id,
          material_id,
          segregation_material_id,
          segregator_id,
          quantity
          )
          VALUES (?,?,?,?,?,?)`;
        let segregationStatusQuery=`UPDATE batches SET status=${body.segregation_completed} 
        WHERE batch_id=${body.batch_id}`
        const segregationInsertPromises = body.materialDetails.map((mat) =>
          segregationModel.executeQuery(segregationCreateQuery, [
            body.batch_id,
            mat.material.po_id,  
            mat.material.purchase_material_id,
            mat.segregationMaterial,
            mat.segregators,
            mat.quantity,
          ])
        );
        const materials = await Promise.all(segregationInsertPromises);
        const segregationStatus = await segregationModel.executeQuery(segregationStatusQuery);
        res.json({materials,segregationStatus});
    
    } catch (e) {
      console.error("Error:", e);
      res.status(500).send("Error");
    }
  });
module.exports = router;