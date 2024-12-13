const db=require('../config/database.config')
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
  const getById = async (id) => {
    const sql = `SELECT supervisor_id,user_name,role,access_token FROM supervisors WHERE supervisor_id=?`;
    return executeQuery(sql, [id]);
  };
  
  const getAll = async () => {
    const sql = 'SELECT * FROM admin_user';
    return executeQuery(sql);
  };
  const create = async (user) => {
    console.log('user',user)
    const {name,role,user_name, user_password,token} = user;
    const sql = `INSERT INTO admin_user (name,role,user_name, user_password,access_token)
     VALUES (?, ?, ?,?,?)`;
    return await executeQuery(sql, [name,role,user_name, user_password,token]);
  };
  

module.exports={executeQuery,create,getById}