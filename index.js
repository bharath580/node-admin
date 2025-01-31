const express = require('express');
// const mysql = require('mysql2');
const cors=require('cors')
// const multer=require('multer')
const path=require('path')
const bodyParser = require('body-parser');
// const bodyParser = require('body-parser');
// const db=require('./config/database.config')
const verifyToken=require('./middleware')
const supplierRouter=require('./router/supplier.router')
const authRouter=require('./router/auth.router')
const purchaseRouter=require('./router/purchase.router')
const batchRouter=require('./router/batches.router')
const baleRouter=require('./router/bale.router')
const saleRouter=require('./router/sale.router')
const dashboardRouter=require('./router/dashboard.router')
const segregationRouter=require('./router/segregation.router')
const buyerRouter=require('./router/buyer.router')
const app = express();



app.use(cors({
  origin: ['http://localhost:3000', 'https://www.hk.kcdev.xyz','http://13.202.98.144:2000','http://52.66.64.25:3000','*'],
}));

app.use(bodyParser.json({ limit: '100mb' })); // or higher if needed
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true })); 
const port = 2000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(express.static('public'))
app.use('/images', express.static(path.join(__dirname, 'public/images')));
// const storage=multer.diskStorage({
//   destination:'../images/',
//   filename:(req,file,cb)=>{
//     return cb(null,`${file.filename}_${Date.now()}${path.extname(file.originalname)}`)
//   }
// })
// const upload=multer({
//   storage:storage
// })
// app.use(upload.any())
app.use('/api/user',authRouter)
app.use('/api/supplier',verifyToken,supplierRouter)
app.use('/api/purchase',purchaseRouter)
app.use('/api/batch',verifyToken,batchRouter)
app.use('/api/bale',verifyToken,baleRouter)
app.use('/api/segregation',verifyToken,segregationRouter)
app.use('/api/sale',verifyToken,saleRouter)
// app.use('/api/sale',verifyToken,saleRouter)
app.use('/api/dashboard',verifyToken,dashboardRouter)
app.use('/api/buyer',verifyToken,buyerRouter)

app.listen(port, (err) => {
  if (err) {
    console.error('Error in server setup:', err);
    return;
  }
  console.log('Server listening on Port', port);
});
