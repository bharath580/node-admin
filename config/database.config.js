
const mysql=require('mysql2')
// const dbConnect = mysql.createPool({
  
//     host: '139.59.40.147',
//     user: 'root',
//     password: 'StagingServer@2017',
//     database: 'hong_kong_db',
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
   
//   });
const dbConnect = mysql.createPool({
  
    host: 'demo.cvi8smqoebdz.ap-south-1.rds.amazonaws.com',
    user: 'admin',
    password: 'baZjkLBPfeFo0tDLkTEO',
    database: 'demo',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
   
  });
dbConnect.getConnection((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1); // Exit the application if unable to connect to the database
    }
    console.log('Connected to the database');
});
module.exports=dbConnect;