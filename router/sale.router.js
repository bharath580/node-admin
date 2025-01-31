const express = require("express");
const db = require("../config/database.config");
const saleModel = require("../model/sale.model");
const router = express.Router();
console.log("sale excecute")

router.get("/", async (req, res) => {
  try {
    const query = `SELECT CONCAT(codes.code,sales.sales_id) AS display_sale_id,sales.*,DATE_FORMAT(sales.created_on, '%e %b %Y') AS date,DATE_FORMAT(sales.created_on, '%H:%i') AS time,SUM(sales_details.quantity) AS quantity,buyer.buyer_name AS buyer_name FROM sales
    JOIN sales_details ON sales.sales_id=sales_details.sale_id
    JOIN buyer ON buyer.buyer_id = sales.buyer_name
    JOIN codes ON codes.name='Sales'
    GROUP BY
    sales.sales_id`;
    const result = await saleModel.executeQuery(query);
    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});
router.get("/saleDropdownList", async (req, res) => {
  try {
    const query = `SELECT concat(codes.code,bales_details.bale_id) as display_bale_id,bales_details.bale_id as bale_id
FROM bales_details 
join codes on codes.code='B'
left join sales_details on sales_details.bale_id=bales_details.bale_id
where sales_details.bale_id is null
GROUP BY bales_details.bale_id`;
    const result = await saleModel.executeQuery(query);
    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});
router.get("/buyer", async (req, res) => {
  try {
    const query = `SELECT * FROM buyer`;
    const result = await saleModel.executeQuery(query);
    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});
router.get("/:id", async (req, res) => {
  const {id}=req.params
  const result={}
  try {
    const query = `SELECT DATE_FORMAT(sales.created_on, '%e %b %Y') as date,
    buyer.buyer_name,buyer.buyer_id,sales.buyer_signature,sales.supervisor_signature,
    COUNT(DISTINCT sales_details.bale_id) AS balesCount,
    COUNT(DISTINCT purchase_order.supplier_id) AS suppliersCount,
    sales.sales_id as sale_id  FROM sales
    JOIN sales_details ON sales_details.sale_id=sales.sales_id
    JOIN bales_details ON bales_details.bale_id=sales_details.bale_id
    JOIN batches_details ON batches_details.batch_id = bales_details.batch_id
    JOIN purchase_order ON purchase_order.po_id=batches_details.purchase_order_id
    JOIN purchase_order_details ON purchase_order_details.po_id=purchase_order.po_id
    JOIN buyer ON buyer.buyer_id = sales.buyer_name
    WHERE sales.sales_id=${id};`;
    const query2=`SELECT bales.bale_id,bales.bale_quantity,bales.bale_material FROM sales_details
    JOIN bales ON bales.bale_id=sales_details.bale_id
    WHERE sales_details.sale_id=${id};`
    result.summary = await saleModel.executeQuery(query);
    result.material = await saleModel.executeQuery(query2)
    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});
router.get("/mobile/:id", async (req, res) => {
  const {id}=req.params
  const result={}
  try {
    const query = `SELECT DATE_FORMAT(sales.created_on, '%d/%m/%Y') as date,CONCAT(codes.code,sales.sales_id) as display_sale_id,sales.buyer_signature AS buyer_signature,sales.supervisor_signature AS supervisor_signature, buyer.buyer_name AS buyer_name,buyer.buyer_id AS buyer_id,
    DATE_FORMAT(sales.created_on, '%H:%i') AS time,sales.sales_id as sale_id,SUM(sales_details.quantity) AS quantity  FROM sales
    JOIN sales_details ON sales_details.sale_id=sales.sales_id
    JOIN codes on codes.name='sales'
    JOIN buyer ON buyer.buyer_id = sales.buyer_name
    WHERE sales.sales_id=${id};`;
    const query2=`SELECT * FROM sales_details
    WHERE sales_details.sale_id=${id};`
    result.summary = await saleModel.executeQuery(query);
    result.material = await saleModel.executeQuery(query2)
    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});
router.post("/postData",async (req, res) => {
  console.log("sale post")

  try {
    
    console.log('get data',req.body)
    const data =req.body
    const {buyer,vehicle,materials,buyerSign,supervisorSign}=data

    // console.log("operatorSignature",operatorSignature)
    // console.log("supervisorSignature",supervisorSignature)
    
    // const supplier_id =purchaseDetail.supplier_id;
    const buyer_name = buyer || '';
    const buyer_signature = buyerSign || '';
    const supervisor_signature=supervisorSign || '';

 
    // console.log('supplier_signature',supplier_signature)
    // const supervisor_signature = supervisorSignature || '';
    // console.log('driver_signature',driver_signature)
    // console.log('supervisor_signature',supervisor_signature)

    const material = materials;
    let saleCreateQuery = `INSERT INTO sales(
        buyer_name,
        buyer_signature,
        supervisor_signature
        )
        VALUES (?, ?, ?)`;

    const result = await saleModel.executeQuery(saleCreateQuery, [
      buyer_name,
      buyer_signature,
      supervisor_signature
      ]);
    
    if (result.insertId) {
      const sale_id = result.insertId;

      console.log("getting id", sale_id);
      let saleMaterialQuery = `INSERT INTO 
      sales_details(sale_id, bale_id, quantity)
      VALUES (?,?,?)`;
      const materialsInsertPromises = material.map((mat) =>
        saleModel.executeQuery(saleMaterialQuery, [
          sale_id,
          mat.material,
          mat.quantity
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
