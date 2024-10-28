const express = require("express");
const db = require("../config/database.config");
const baleModel = require("../model/bale.model");
const router = express.Router();
router.get("/baleMaterial", async (req, res) => {
  try {
    const query = "SELECT * FROM baling_material"
    const result = await baleModel.executeQuery(query);
    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});
router.get("/baleDropdownList", async (req, res) => {
  try {
    const query = `SELECT concat(codes.code,batches_details.batch_id) as batch_id FROM batches_details join codes on codes.code='BAT'
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
    const query = `SELECT CONCAT(codes.code,bales.bale_id) AS display_bale_id,bales.*,
    DATE_FORMAT(bales.created_on, '%d/%m/%Y') AS date FROM bales
    JOIN codes ON codes.name='Bale'`;
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
    const sql = `SELECT bales.bale_id,SUM(bales_details.quantity) AS bale_quantity,bales.bale_material,DATE_FORMAT(bales.created_on, '%d/%m/%Y') AS date,bales.sold FROM bales JOIN bales_details ON bales_details.bale_id = bales.bale_id
    WHERE bales.bale_id=${id}`;
    const sql1 = `SELECT bales_details.batch_id,bales_details.quantity FROM bales
    JOIN bales_details ON bales_details.bale_id=bales.bale_id
    WHERE bales.bale_id=${id}`
     result.summary = await baleModel.executeQuery(sql);
     result.material = await baleModel.executeQuery(sql1);
    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});

module.exports = router;
