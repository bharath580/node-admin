const jwt= require('jsonwebtoken')

const secretKey='abcd'

const verifyToken=(req,res,next)=>{
  // console.log(req.headers)
  let token =req.headers['authorization']
  //  console.log("token",token)
    if(!token){
      console.log('error')
        return res.json({message:'No token provided'})
    }
    // console.log(token)

    token=token.split(' ')[1]
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.json({ message:err });
          }
        req.user = decoded;
        // console.log('decoded',decoded)
        next();
      });
    };
    

module.exports=
    verifyToken
