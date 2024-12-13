const db = require("../config/database.config");
const executeQuery = (sql, values) => {
    // console.log("batches excecute",sql,"values",values)
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
    const sql = "SELECT * FROM buyer";
    return executeQuery(sql);
  };

  const create = async (user) => {
    const {
      buyer_name,
      address,
      age,
      phone,
      id_proof_type,
      buyer_signature,
      buyer_image,
      id_proof_number,
      bank_account_number,
      id_proof_image
    } = user;
    const sql =
      "INSERT INTO buyer (buyer_name, address, age,phone,id_proof_type,buyer_signature,buyer_image,id_proof_number,bank_account_number,id_proof_image ) VALUES (?, ?, ?,?,?,?,?,?,?,?)";
    return executeQuery(sql, [
      buyer_name,
      address,
      age,
      phone,
      id_proof_type,
      buyer_signature,
      buyer_image,
      id_proof_number,
      bank_account_number,
      id_proof_image
    ]);
  };
module.exports = { executeQuery,getAll,create };