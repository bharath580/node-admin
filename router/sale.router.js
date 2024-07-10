const express = require("express");
const db = require("../config/database.config");
const saleModel = require("../model/sale.model");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const query = `SELECT CONCAT(codes.code,sales.sales_id) AS display_sale_id,sales.*,DATE_FORMAT(sales.created_on, '%d/%m/%Y') AS date,SUM(sales_details.quantity) AS quantity FROM sales
    JOIN sales_details ON sales_details.sale_id=sales_details.sale_id
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
router.get("/:id", async (req, res) => {
  const {id}=req.params
  const result={}
  try {
    const query = `SELECT DATE_FORMAT(sales.created_on, '%d/%m/%Y') as date,sales.buyer_name,COUNT(DISTINCT sales_details.bale_id) AS balesCount,COUNT(DISTINCT purchase_order.supplier_id) AS suppliersCount  FROM sales
    JOIN sales_details ON sales_details.sale_id=sales.sales_id
    JOIN bales_details ON bales_details.bale_id=sales_details.bale_id
    JOIN batches_details ON batches_details.batch_id = bales_details.batch_id
    JOIN purchase_order ON purchase_order.po_id=batches_details.purchase_order_id
    JOIN purchase_order_details ON purchase_order_details.po_id=purchase_order.po_id
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

module.exports = router;
