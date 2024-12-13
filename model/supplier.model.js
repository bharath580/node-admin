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
  const sql = "SELECT * FROM suppliers";
  return executeQuery(sql);
};

const getById = async (id) => {
  const sql = `SELECT s.*,
  s.supplier_id,
  s.supplier_name,
  s.phone,
  s.address,
  s.age,
  s.id_proof_type,
  ROUND(SUM(pd.quantity), 2) AS volume_procured,
  ROUND(SUM(pd.quantity) / COUNT(DISTINCT p.po_id), 2) AS avg_quantity,
  COUNT(DISTINCT p.po_id) AS order_number,
  s.supplier_signature
FROM
  suppliers AS s
LEFT JOIN
  purchase_order AS p ON p.supplier_id = s.supplier_id
LEFT JOIN
  purchase_order_details AS pd ON p.po_id = pd.po_id
WHERE
  s.supplier_id = ${id}
GROUP BY
  s.supplier_id
  `;
  return executeQuery(sql, [id]);
};

const create = async (user) => {
  const {
    supplier_name,
    address,
    age,
    phone,
    id_proof_type,
    supplier_signature,
    supplier_image,
    id_proof_number,
    bank_account_number,
    id_proof_image
  } = user;
  const sql =
    "INSERT INTO suppliers (supplier_name, address, age,phone,id_proof_type,supplier_signature,supplier_image,id_proof_number,bank_account_number,id_proof_image ) VALUES (?, ?, ?,?,?,?,?,?,?,?)";
  return executeQuery(sql, [
    supplier_name,
    address,
    age,
    phone,
    id_proof_type,
    supplier_signature,
    supplier_image,
    id_proof_number,
    bank_account_number,
    id_proof_image
  ]);
};

const update = async (userId, user) => {
  const { username, email, password } = user;
  const sql =
    "UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?";
  return executeQuery(sql, [username, email, password, userId]);
};

const deleteSupplier = async (userId) => {
  const sql = "DELETE FROM users WHERE id = ?";
  return executeQuery(sql, [userId]);
};
module.exports = { create, getById, getAll, update, deleteSupplier };
