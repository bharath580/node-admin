const express = require("express");
const db = require("../config/database.config");
const dashboardModel = require("../model/dashboard.model");
const router = express.Router();

console.log("dashboard excecute")
const currentDate = new Date();
const dayOfWeek = currentDate.getDay();
const startOfWeek = new Date(currentDate);
startOfWeek.setDate(currentDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
startOfWeek.setUTCHours(startOfWeek.getUTCHours() + 5); // Adding 5 hours for IST
startOfWeek.setUTCMinutes(startOfWeek.getUTCMinutes() + 30); // Adding 30 minutes for IST

const endOfWeek = new Date(startOfWeek);
endOfWeek.setDate(startOfWeek.getDate() + 5);

router.get("/", async (req, res) => {
    const data=req.query
    data.startDate = data.startDate ? new Date(data.startDate) : startOfWeek;
    data.endDate = data.endDate ? new Date(data.endDate) : endOfWeek;
    const formattedStartDate = data.startDate.toISOString().split('T')[0];
    const formattedEndDate = data.endDate.toISOString().split('T')[0];
    const result={}
    try {
        console.log("currentDate",currentDate)
        console.log("start",startOfWeek)
        console.log("end",endOfWeek)
        console.log("formattedStartDate",formattedStartDate)
        console.log("formattedEndDate",formattedEndDate)
       
      const volume = `SELECT SUM(purchase_order_details.quantity) AS volume_procured FROM purchase_order 
      JOIN purchase_order_details
      ON purchase_order_details.po_id=purchase_order.po_id 
      WHERE purchase_order.date > '${formattedStartDate}'
      AND purchase_order.date < date_add('${formattedEndDate}', INTERVAL 1 DAY)`;
      
      const segregated = `SELECT round(sum(segregation.quantity),0) AS segragation_volume 
      from segregation where segregation.created_on>='${formattedStartDate}' 
      AND segregation.created_on<date_add('${formattedEndDate}', INTERVAL 1 DAY)`;
      
      const sold=`SELECT ROUND(SUM(sd.quantity), 0) AS volume_sold 
      FROM sales_details sd
      JOIN sales s ON s.sales_id = sd.sale_id
      WHERE s.created_on >= '${formattedStartDate}' 
      AND s.created_on < DATE_ADD('${formattedEndDate}', INTERVAL 1 DAY);`

      const orders=`SELECT COUNT(po_id) AS no_of_orders 
      FROM purchase_order
      WHERE DATE(date) >= '${formattedStartDate}' 
      AND DATE(date) < DATE_ADD('${formattedEndDate}', INTERVAL 1 DAY);`

      const quantityByMaterial=`SELECT purchase_materials.material_name,COALESCE(SUM(purchase_order_details.quantity), 0) AS total_quantity FROM purchase_order RIGHT JOIN purchase_order_details ON purchase_order.po_id=purchase_order_details.po_id
      RIGHT JOIN purchase_materials ON purchase_order_details.purchase_material_id=purchase_materials.purchase_material_id
      WHERE purchase_order.date>= '${formattedStartDate}' 
      AND purchase_order.date < DATE_ADD('${formattedEndDate}', INTERVAL 1 DAY)
      GROUP BY purchase_materials.purchase_material_id,purchase_materials.material_name;`

      const topSuppliers=`SELECT suppliers.supplier_id,suppliers.supplier_name,SUM(purchase_order_details.quantity) AS quantity FROM
      suppliers
      JOIN purchase_order ON purchase_order.supplier_id = suppliers.supplier_id
      JOIN purchase_order_details ON purchase_order_details.po_id=purchase_order.po_id 
       WHERE DATE(purchase_order.date) >= '${formattedStartDate}' 
            AND DATE(purchase_order.date) < DATE_ADD('${formattedEndDate}', INTERVAL 1 DAY)
      GROUP BY suppliers.supplier_id LIMIT 10`
      const segregationMaterial=`SELECT segregation_material.material AS material, round(SUM(segregation.quantity),0) AS quantity
      FROM segregation, segregation_material
      WHERE segregation.material_id=segregation_material.segregation_material_id
      AND segregation.created_on>='${formattedStartDate}'
      AND segregation.created_on<date_add('${formattedEndDate}', INTERVAL 1 DAY)
      GROUP BY material
      ORDER BY quantity DESC`
       result.procured_volume = await dashboardModel.executeQuery(volume);
       result.segregated = await dashboardModel.executeQuery(segregated);
       result.sold_volume = await dashboardModel.executeQuery(sold);
       result.noOfOrders = await dashboardModel.executeQuery(orders);
       result.quantityByMaterial = await dashboardModel.executeQuery(quantityByMaterial);
       result.topSuppliers = await dashboardModel.executeQuery(topSuppliers);
       result.segregationMaterial = await dashboardModel.executeQuery(segregationMaterial);
       
      res.json(result);
    } catch (e) {
      console.error("Error:", e);
      res.status(500).send("Error");
    }
  });
  module.exports = router;