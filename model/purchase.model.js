const db = require("../config/database.config");
const executeQuery = (sql, values) => {
    
  return new Promise((resolve, reject) => {
    db.execute(sql, values, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};
const getAll = async () => {
  const sql = `SELECT CONCAT(codes.code,purchase_order.po_id) AS display_order_id,
  purchase_order.po_id AS order_id,
  DATE_FORMAT(purchase_order.date, '%d/%m/%Y') AS date,DATE_FORMAT(purchase_order.date, '%H:%i') AS time,
  suppliers.supplier_id AS supplier_id,purchase_order.supplier_signature as supplier_signature,
  suppliers.supplier_name AS supplier,
  SUM(
      purchase_order_details.quantity
  ) AS quantity,
  IF(
    purchase_order.procurement_mode = 1, 
    IF(
        (purchase_order.supplier_signature IS NOT NULL AND purchase_order.supplier_signature != '') AND 
        purchase_order.driver_signature IS NOT NULL AND 
        purchase_order.supervisor_signature IS NOT NULL, 
        1, 
        0
    ),
    IF(
        purchase_order.procurement_mode = 2, 
        IF(
            (purchase_order.supplier_signature IS NOT NULL AND purchase_order.supplier_signature != '') AND 
            purchase_order.supervisor_signature IS NOT NULL, 
            1, 
            0
        ),
        0
    )
) AS traceability
FROM
  purchase_order
JOIN purchase_order_details
ON purchase_order.po_id = purchase_order_details.po_id
JOIN suppliers 
ON purchase_order.supplier_id = suppliers.supplier_id
JOIN codes ON codes.name='Purchases'
GROUP BY
  purchase_order.po_id
ORDER BY
purchase_order.po_id desc;`;


  return await executeQuery(sql);
};

const getById = async (id) => {
  console.log("purchase id excecute")
  try {
    const sql = `SELECT
      *, DATE_FORMAT(purchase_order.date, '%d/%m/%Y') AS date,CONCAT(codes.code,purchase_order.po_id) AS display_order_id,
      SUM(purchase_order_details.quantity) AS totalQuantity,purchase_order.supplier_signature 
      AS supplierSignature 
    FROM
      purchase_order
    JOIN purchase_order_details 
    ON purchase_order.po_id = purchase_order_details.po_id
    JOIN suppliers 
    ON purchase_order.supplier_id = suppliers.supplier_id
    JOIN codes ON codes.name='Purchases'
    WHERE purchase_order.po_id = ${id}`;

    const sql2 = `SELECT
      pod.*,pm.material_name,CONCAT(pm.code,po.po_id) AS material_code
    FROM
      purchase_order_details pod
    JOIN purchase_order po ON pod.po_id = po.po_id
    JOIN suppliers s ON po.supplier_id = s.supplier_id
    JOIN purchase_materials pm ON pm.purchase_material_id=pod.purchase_material_id 
    WHERE po.po_id = ${id}`;

    const purchase_order = await executeQuery(sql);
    const purchase_order_details = await executeQuery(sql2);

    return { purchase_order, purchase_order_details };
  } catch (error) {
    // Handle errors
    console.error("Error:", error);
    throw error; // Rethrow the error or handle it according to your application logic
  }
};


const create=async ()=>{
    
}

module.exports = { getAll, getById,executeQuery };
