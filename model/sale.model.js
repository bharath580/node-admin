const db = require("../config/database.config");
const executeQuery = (sql, values) => {
    console.log("batches excecute",sql,"values",values)
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
module.exports = { executeQuery };