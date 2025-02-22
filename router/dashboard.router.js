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
      const purchaseTrend=`SELECT 
    DATE(purchase_order.date) AS order_date, 
    SUM(purchase_order_details.quantity) AS total_quantity
FROM purchase_order 
JOIN purchase_order_details 
    ON purchase_order.po_id = purchase_order_details.po_id
WHERE purchase_order.date BETWEEN '${formattedStartDate}' AND '${formattedEndDate}'
GROUP BY order_date
ORDER BY order_date;`
const segregationTrend = `SELECT 
    DATE(segregation.created_on) AS segregation_date, 
    SUM(segregation.quantity) AS total_quantity
FROM segregation
WHERE segregation.created_on BETWEEN '${formattedStartDate}' AND '${formattedEndDate}'
GROUP BY segregation_date
ORDER BY segregation_date;
`
const baleTrend=`SELECT DATE(bales.created_on) as bale_date,sum(bales_details.quantity) as quantity FROM bales
join bales_details on bales.bale_id=bales_details.bale_id
where bales.created_on between '${formattedStartDate}' and '${formattedEndDate}'
group by bale_date order by bale_date;`
const baleVolumeByMaterial=`SELECT baling_material.name as material,round(SUM(bales_details.quantity),0) AS quantity FROM bales
join bales_details on bales.bale_id=bales_details.bale_id
join baling_material on bales.bale_material=baling_material.id
 WHERE bales.created_on>= '${formattedStartDate}' 
      AND bales.created_on < DATE_ADD('${formattedEndDate}', INTERVAL 1 DAY)
      group by baling_material.id,baling_material.name;`

const traceability =`select distinct purchase_order.po_id,
 IF(purchase_order.procurement_mode=1, IF(purchase_order.supplier_signature IS NOT NULL AND purchase_order.supplier_signature != '' AND 
 purchase_order.driver_signature IS NOT NULL AND purchase_order.driver_signature != '' AND
 purchase_order.supervisor_signature IS NOT NULL AND purchase_order.supervisor_signature != '', 1,0),
            IF(purchase_order.procurement_mode=2, IF(purchase_order.supplier_signature IS NOT NULL 
          AND purchase_order.supplier_signature != ''  AND purchase_order.supervisor_signature IS NOT NULL AND purchase_order.supervisor_signature != '', 1,0),0)) AS traceability
 from purchase_order join
purchase_order_details on purchase_order_details.po_id = purchase_order.po_id
join batches_details on batches_details.purchase_order_id=purchase_order.po_id
join batches on batches.batch_id = batches_details.batch_id 
join bales_details on bales_details.batch_id= batches.batch_id
join bales on bales.bale_id=bales_details.bale_id
join sales_details on sales_details.bale_id=bales.bale_id
join sales on sales.sales_id = sales_details.sale_id
WHERE sales.created_on BETWEEN '${formattedStartDate}' AND '${formattedEndDate}';
`      
const segregation_quantity=`select 
sum(segregation.quantity) as total_quantity from purchase_order
join purchase_order_details on purchase_order_details.po_id = purchase_order.po_id
join batches_details on batches_details.purchase_order_id = purchase_order_details.po_id
join bales_details on bales_details.batch_id = batches_details.batch_id
join sales_details on sales_details.bale_id = bales_details.bale_id
join sales on sales.sales_id=sales_details.sale_id
join segregation on segregation.po_id = purchase_order.po_id
join segregation_material on segregation.segregation_material_id = segregation_material.segregation_material_id
WHERE sales.created_on BETWEEN '${formattedStartDate}' AND '${formattedEndDate}'`
const segregation_loss=`SELECT 
    SUM(segregation.quantity) AS total_quantity
   
FROM purchase_order
    JOIN purchase_order_details ON purchase_order_details.po_id = purchase_order.po_id
    JOIN batches_details ON batches_details.purchase_order_id = purchase_order_details.po_id
    JOIN bales_details ON bales_details.batch_id = batches_details.batch_id
    JOIN sales_details ON sales_details.bale_id = bales_details.bale_id
    JOIN sales ON sales.sales_id = sales_details.sale_id
    JOIN segregation ON segregation.po_id = purchase_order.po_id
    JOIN segregation_material ON segregation.segregation_material_id = segregation_material.segregation_material_id
WHERE 
    sales.created_on BETWEEN '${formattedStartDate}' AND '${formattedEndDate}'
    AND segregation_material.rejects = 1`
       const segregationQuantity=await dashboardModel.executeQuery(segregation_quantity);
       const segregationLoss=await dashboardModel.executeQuery(segregation_loss);
       const quality = segregationLoss == null && segregationLoss !== 0 
    ? Number(((segregationQuantity[0].total_quantity / segregationLoss[0].total_quantity) * 100).toFixed(2)) 
    : 100;

       result.procured_volume = await dashboardModel.executeQuery(volume);
       result.segregated = await dashboardModel.executeQuery(segregated);
       result.sold_volume = await dashboardModel.executeQuery(sold);
       result.noOfOrders = await dashboardModel.executeQuery(orders);
       result.quantityByMaterial = await dashboardModel.executeQuery(quantityByMaterial);
       result.topSuppliers = await dashboardModel.executeQuery(topSuppliers);
       result.segregationMaterial = await dashboardModel.executeQuery(segregationMaterial);
       result.purchaseTrend = await dashboardModel.executeQuery(purchaseTrend);
       result.segregationTrend = await dashboardModel.executeQuery(segregationTrend);
       result.baleTrend = await dashboardModel.executeQuery(baleTrend);
       result.baleVolumeByMaterial = await dashboardModel.executeQuery(baleVolumeByMaterial);
       result.traceability = await dashboardModel.executeQuery(traceability);
       const traceableOrders = result.traceability.reduce((sum, item) => sum + (item.traceability || 0), 0);
       console.log('traceableOrders',traceableOrders)
       const totalOrders = result.traceability.length;
       console.log(totalOrders);;
       result.traceabilityValue = totalOrders > 0 
    ? parseFloat(((traceableOrders / totalOrders) * 100).toFixed(2)) 
    : 0;
      result.quality=quality;
      console.log('quality',segregationLoss)
      res.json(result);
    } catch (e) {
      console.error("Error:", e);
      res.status(500).send("Error");
    }
  });
  module.exports = router;