const express = require('express');
const session = require('express-session');
const app = express();
const pool = require('./database')
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const https = require('https');
const path = require('path');

//jwt auth
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET

//jwt auth end

//load SSL certificate
const sslKey = fs.readFileSync(path.join(__dirname, 'key.pem'));
const sslCert = fs.readFileSync(path.join(__dirname, 'cert.pem'));
//end


//sha256
const crypto = require('crypto');
const { error } = require('console');
function sha256(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}
//sha256 end

//csrf door if needed
app.use(cors());

// {
//   origin: ['https://xxx.com', 'https://yyy.com'],
//   credentials: true, // Optional: If you need to allow credentials
// }

app.use(express.static('public'));
// parse form data
app.use(express.urlencoded({ extended: false }))
// parse json
app.use(express.json())

//HTTPS server:
const httpsServer = https.createServer({
    key: sslKey,
    cert: sslCert,
}, app);
//created 


function authenticateToken(req, res, next) {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({success: false, error: 'دسترسی به این بخش محدود شده و شما دسترسی لازمه را ندارید' });
    }
    try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).json({success: false, error:'توکن لازمه معتبر نیست' });
    }
}


app.post('/api/v1/login', (req, res) => {

    console.log('Request body:', req.body); // Debugging line

    console.log('hit getallprod')
    

    let { username, password } = req.body;
    password = sha256(password)
    console.log('password sha='+password);
    // Check if the username and password are valid
    pool.query(`
    SELECT username,password,workPlace,userId,fullName
    FROM xicorana.user
    WHERE username=? AND password=?
    ;`,[username,password],(err,result,fields)=>{

        if(err){
            
            const data = String(err);
            res.status(500).json({ success: false, error: `${data}` });
            return console.log(err);
            
        }
        if(result.length === 0 ){

            res.status(401).json({ success: false, error: `نام کاربری یا رمز عبور اشتباه است` });
            return ;
        }

        const token = jwt.sign({ username: result[0].username }, process.env.JWT_SECRET);
        res.json({ token, workPlace: result[0].workPlace, userId: result[0].userId, fullName: result[0].fullName });

    });
    
});

app.post('/api/v1/logout', (req, res) => {
    // Nothing to do here for JWT-based authentication
    res.json({ message: 'با  موفقیت از حساب کاربری خود خارج شدید' });
});

function authenticateToken(req, res, next) {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({success: false, error: 'دسترسی به این بخش محدود شده و شما دسترسی لازمه را ندارید' });
    }
    try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).json({success: false, error:'توکن لازمه معتبر نیست' });
    }
}



///////////////////////////////////////////////////////////////////////////////////////////////////////////////HANDHELD
//HANDLING ENTERIES
app.put('/api/v1/entry/:uid',authenticateToken, (req, res) => {


    const { wpId } = req.body;
    const uid = req.params.uid;
    console.log(wpId,uid);

    let aghayeQC=''

    let firstQueryToRun = ''
    const firstQueries = {
      'wsp': `
      SELECT wspQC
      FROM xicorana.wirespool
      WHERE wspId = ? ;

      `,
      'ins': `
      SELECT insQC
      FROM xicorana.insul
      WHERE insId = ? ;
      `,
      'car': `
      SELECT cartQC
      FROM xicorana.cart
      WHERE cartId = ? ;

      `,
      'fip': `fip`
    };

    switch (uid.substring(0, 3)) {
      case 'wsp':
        firstQueryToRun = firstQueries['wsp'];
        break;
      case 'ins':
        firstQueryToRun = firstQueries['ins'];
        break;
      case 'car':
        firstQueryToRun = firstQueries['car'];
        break;
      case 'fip':
        firstQueryToRun = firstQueries['fip'];
        break;
      default:
        res.status(400).json({ success: false, error: 'Invalid uid prefix' });
        return;
    }
    if (firstQueryToRun != 'fip'){
    pool.query(firstQueryToRun,[uid],(err,result,fields)=>{
    
          if(err){
              
              const data = String(err);
              res.status(500).json({ success: false, error: `${data}` });
              return console.log(err);
              
          }
          if(result[0].insQC==1 || result[0].cartQC==1 || result[0].wspQC==1){
    
              aghayeQC=1;
              return ;
          }else{
            aghayeQC=0;
          }
  
      });
    }

    let queryToRun='';

    const queries = {
        'wsp': `
          UPDATE xicorana.wirespool
          SET wpId = ?, wspLL='ورود'
          WHERE wspId = ? AND wpId != ? AND wspLL != 'ورود';
        `,
        'ins': `
          UPDATE xicorana.insul
          SET wpId = ?, insLL='ورود'
          WHERE insId = ? AND wpId != ? AND insLL != 'ورود';
        `,
        'car': `
          UPDATE xicorana.cart
          SET wpId = ?, cartLL = 'ورود'
          WHERE cartId = ? AND wpId != ? AND cartLL != 'ورود';
        `,
        'fip': `
          UPDATE xicorana.finalproduct
          SET wpId = ?, fpLL = 'ورود'
          WHERE fpId = ? AND wpId != ? AND fpLL != 'ورود';
        `
      };
      
      switch (uid.substring(0, 3)) {
        case 'wsp':
          queryToRun = queries['wsp'];
          break;
        case 'ins':
          queryToRun = queries['ins'];
          break;
        case 'car':
          queryToRun = queries['car'];
          break;
        case 'fip':
          queryToRun = queries['fip'];
          break;
        default:
          res.status(400).json({ success: false, error: 'Invalid uid prefix' });
          return;
      }

    console.log('Executing query:', queryToRun);
    pool.query(queryToRun,[wpId,uid,wpId],(err,result,fields)=>{
        
        try{

            if(err){
            
                const data = String(err);
                res.status(500).json({ success: false, error: `${data}` });
                return console.log(err);
            
            }
            
            if (result.affectedRows === 0) {
                res.status(404).json({ success: false, error: `محصولی برای ورود ثبت نشد. برای اطلاعات بیشتر وضعیت کنترل کیفیت و یا مکان فعلی محصول را مشاهده کنید.` });
                return;
            }else{
              pool.query(`
                SELECT wpName,wpPhoneNumber FROM xicorana.workplace where wpId=?;
                `,[wpId],(err,result,fields)=>{
              
                    if(err){
                        
                        const data = String(err);
                        
              
                        res.status(404).json({ success: false, error: `.ورود با موفقیت انجام شد اما ارسال پیامک به سرپرست انبار با مشکل مواجه شد` });
                        return ;
                        
                    }
                    if(result.length === 0 ){
              
                        res.status(404).json({ success: false, error: `ورود با موفقیت انجام شد اما ارسال پیامک به سرپرست انبار با مشکل مواجه شد` });
                        return ;
                    }
              
                    let phoneNumber = String(result[0].wpPhoneNumber);
                    let wpName = String(result[0].wpName);
                    
                
                smsText= `ورود کالای ${uid} به انبار ${wpName} صورت گرفت
                سامانه ردیابی افشان نگار آریا`
                
                    console.log("clg phonenumber bala: "+phoneNumber);
                    
                    let axiosFullreq = "https://api.sms-webservice.com/api/V3/Send?ApiKey=@@&SecretKey=@@&Text="+smsText+"&Sender=@number@&Recipients="+phoneNumber;
                console.log("sikooo"+axiosFullreq+"sikooo");
              axios.get(axiosFullreq).then(function(response) {
                console.log(response);
                }).catch(function(error) {
                console.log(error);
                });
                if(aghayeQC==1){
                  res.status(200).json({ success: true, data: `محصول وارد شد` });
                }else{
                  res.status(200).json({ success: 'alert' , data: `محصول وارد شد`, alert:'محصول مورد نظر دارایی تاییدیه کنترل کیفی نیست!'});
                }
                return console.log(result);
                });
              
                  
            }


        
        }catch(err){
            res.status(500).json({ success: false, error: `${err}` });
        }
    });

    // res.status(200).json({ success: true, data: people })
});




app.get('/api/v1/protected',authenticateToken, (req, res) => {

    res.json({ message: `Welcome, Jane` });
});

//HANDELING EXITS

app.put('/api/v1/exit/:uid',authenticateToken, (req, res) => {


    const { wpId } = req.body;
    const uid = req.params.uid;
    console.log(wpId,uid);

    let aghayeQC=''

    let firstQueryToRun = ''
    const firstQueries = {
      'wsp': `
      SELECT wspQC
      FROM xicorana.wirespool
      WHERE wspId = ? ;

      `,
      'ins': `
      SELECT insQC
      FROM xicorana.insul
      WHERE insId = ? ;
      `,
      'car': `
      SELECT cartQC
      FROM xicorana.cart
      WHERE cartId = ? ;

      `,
      'fip': `fip`
    };

    switch (uid.substring(0, 3)) {
      case 'wsp':
        firstQueryToRun = firstQueries['wsp'];
        break;
      case 'ins':
        firstQueryToRun = firstQueries['ins'];
        break;
      case 'car':
        firstQueryToRun = firstQueries['car'];
        break;
      case 'fip':
        firstQueryToRun = firstQueries['fip'];
        break;
      default:
        res.status(400).json({ success: false, error: 'Invalid uid prefix' });
        return;
    }
    if (firstQueryToRun != 'fip'){
    pool.query(firstQueryToRun,[uid],(err,result,fields)=>{
    
          if(err){
              
              const data = String(err);
              res.status(500).json({ success: false, error: `${data}` });
              return console.log(err);
              
          }
          if(result[0].insQC==1 || result[0].cartQC==1 || result[0].wspQC==1){
    
              aghayeQC=1;
              return ;
          }else{
            aghayeQC=0;
          }
  
      });
    }

    let queryToRun='';

    const queries = {
        'wsp': `
        UPDATE xicorana.wirespool
        SET wspLL='خروج'
        WHERE wspId = ? AND wpId = ? AND wspLL != 'خروج';

        `,
        'ins': `
        UPDATE xicorana.insul
        SET insLL='خروج'
        WHERE insId = ? AND wpId = ? AND insLL != 'خروج';
        `,
        'car': `
        UPDATE xicorana.cart
        SET cartLL = 'خروج'
        WHERE cartId = ? AND wpId = ? AND cartLL != 'خروج';

        `,
        'fip': `
        UPDATE xicorana.finalproduct
        SET fpLL = 'خروج'
        WHERE fpId = ? AND wpId = ? AND fpLL != 'خروج';
        `
      };
      
      switch (uid.substring(0, 3)) {
        case 'wsp':
          queryToRun = queries['wsp'];
          break;
        case 'ins':
          queryToRun = queries['ins'];
          break;
        case 'car':
          queryToRun = queries['car'];
          break;
        case 'fip':
          queryToRun = queries['fip'];
          break;
        default:
          res.status(400).json({ success: false, error: 'Invalid uid prefix' });
          return;
      }

    console.log('Executing query:', queryToRun);
    pool.query(queryToRun,[uid,wpId],(err,result,fields)=>{
        
        try{

            if(err){
            
                const data = String(err);
                res.status(500).json({ success: false, error: `${data}` });
                return console.log(err);
            
            }
            
            if (result.affectedRows === 0) {
                res.status(404).json({ success: false, error: `محصولی برای خروج ثبت نشد. برای اطلاعات بیشتر وضعیت کنترل کیفیت و یا مکان فعلی محصول را مشاهده کنید.` });
                return;
            }else{


              pool.query(`
                SELECT wpName,wpPhoneNumber FROM xicorana.workplace where wpId=?;
                `,[wpId],(err,result,fields)=>{
              
                    if(err){
                        
                        const data = String(err);
                        
              
                        res.status(404).json({ success: false, error: `.خروج با موفقیت انجام شد اما ارسال پیامک به سرپرست انبار با مشکل مواجه شد` });
                        return ;
                        
                    }
                    if(result.length === 0 ){
              
                        res.status(404).json({ success: false, error: `خروج با موفقیت انجام شد اما ارسال پیامک به سرپرست انبار با مشکل مواجه شد` });
                        return ;
                    }
              
                    let phoneNumber = String(result[0].wpPhoneNumber);
                    let wpName = String(result[0].wpName);
                    
                smsText= `خروج کالای ${uid} از انبار ${wpName} صورت گرفت
                سامانه ردیابی اقشان نگار آریا`
                
                    console.log("clg phonenumber bala: "+phoneNumber);
                    
                    let axiosFullreq = "https://api.sms-webservice.com/api/V3/Send?ApiKey=@@&SecretKey=@@&Text="+smsText+"&Sender=@number@&Recipients="+phoneNumber;
                console.log("sikooo"+axiosFullreq+"sikooo");
              axios.get(axiosFullreq).then(function(response) {
                console.log(response);
                }).catch(function(error) {
                console.log(error);
                });
                if(aghayeQC==1){
                  res.status(200).json({ success: true, data: `محصول خارج شد` });
                }else{
                  res.status(200).json({ success: 'alert' , data: `محصول خارج شد`, alert:'محصول مورد نظر دارایی تاییدیه کنترل کیفی نیست!' });
                }
                return console.log(result);
                });
              
              
              
                
            }


        
        }catch(err){
            res.status(500).json({ success: false, error: `${err}` });
        }
    });

    // res.status(200).json({ success: true, data: people })
});


//Handling displaying all products

app.get('/api/v1/prod/name',authenticateToken, (req, res) => {


  console.log('hit get /prod/name')

  pool.query(`
  SELECT prodName,prodId FROM xicorana.product;
  `,[],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.length === 0 ){

          res.status(404).json({ success: false, error: ` محصولی یافت نشد` });
          return ;
      }

      res.status(200).json({ success: true, data: result });
      return console.log(result);
  });

  
  
  // res.status(200).json({ success: true, data: people })
});


//HADNELING PLACEMENT

app.put('/api/v1/placement/:uid',authenticateToken, (req, res) => {


    const { sectorNew,wpId } = req.body;
    const uid = req.params.uid;
    console.log(sectorNew,wpId,uid);

    let queryToRun='';

    const queries = {
        'wsp': `
        UPDATE xicorana.wirespool
        SET wspSector = ?
        WHERE wspId = ? AND wspSector != ? AND wpId = ? ;
        `,
        'ins': `
        UPDATE insul
        SET insSector = ?
        WHERE insId = ? AND insSector != ? AND wpId = ? ;
        `,
        'fip': `
        UPDATE finalproduct 
        SET fpSector = ? 
        WHERE fpId = ? AND fpSector != ? AND wpId = ? ;
        `
      };
      
      switch (uid.substring(0, 3)) {
        case 'wsp':
          queryToRun = queries['wsp'];
          break;
        case 'ins':
          queryToRun = queries['ins'];
          break;
        case 'fip':
          queryToRun = queries['fip'];
          break;
        default:
          res.status(400).json({ success: false, error: 'Invalid uid prefix' });
          return;
      }

    console.log('Executing query:', queryToRun);
    pool.query(queryToRun,[sectorNew,uid,sectorNew,wpId],(err,result,fields)=>{
        
        try{

            if(err){
            
                const data = String(err);
                res.status(500).json({ success: false, error: `${data}` });
                return console.log(err);
            
            }
            
            if (result.affectedRows === 0) {
                res.status(404).json({ success: false, error: `محصولی به جایی منتقل نشد. برای اطلاعات بیشتر وضعیت مکان کنونی محصول و از تطبیق مکان کاری خود با مکانی که به آنجا جاینگاری میکنید اطمینان حاصل فرمایید .` });
                return;
            }else{
                console.log(result);
                res.status(200).json({ success: true, data: `محصول به سکتور ${sectorNew}منتقل شد`});
            }


        
        }catch(err){
            res.status(500).json({ success: false, error: `${err}` });
        }
    });

    // res.status(200).json({ success: true, data: people })
});

//HANDLING REQUESTS
app.get('/api/v1/request',authenticateToken, (req, res) => {


  const { userId } = req.query;
  

  console.log('hit get request')

  pool.query(`
  SELECT reqId,reqDate,reqType,reqDetail,reqSender 
  FROM xicorana.request 
  where reqOk='pending' and reqReciever=?;
  `,[userId],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.length === 0 ){

          res.status(404).json({ success: false, error: `درخواستی یافت نشد` });
          return ;
      }

      res.status(200).json({ success: true, data: result });
      return console.log(result);
  });

  
  
  // res.status(200).json({ success: true, data: people })
});


app.put('/api/v1/request/:reqId',authenticateToken, (req, res) => {

  const { reqOk,reqReciever } = req.body;
  const reqId = req.params.reqId;

  console.log('hit get request')

  pool.query(`
  UPDATE xicorana.request 
  SET reqOk=?
  where reqId=? AND reqReciever=?;
  `,[reqOk,reqId,reqReciever],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.affectedRows === 0 ){

          res.status(404).json({ success: false, error: `تغییری انجام نپذیرفت، وضعیت در خواست از قبل تعیین شده و یا ارتباط شما با سرور دچار مشکل شده است` });
          return ;
      }

      let reqOkpersian = reqOk;
      if (reqOk=="approved"){
        reqOkpersian="تایید شده"
      }else{
        reqOkpersian="رد شده"
      }
      res.status(200).json({ success: true, data: " وضعیت درخواست به "+reqOkpersian+" تغییر کرد" });
      return console.log(result);
  });

  
  
  // res.status(200).json({ success: true, data: people })
});




app.get('/api/v1/order',authenticateToken, (req, res) => {


  const { userId } = req.query;
  

  console.log('hit get order')

  pool.query(`
  SELECT 
    o.ordId,
    o.orderSituation,
    o.orderDate, 
    c.custName
  FROM
    xicorana.order o
  JOIN
    xicorana.customer c ON o.custId = c.custId
  WHERE
    o.orderApproval = '1';
  `,[],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.length === 0 ){

          res.status(404).json({ success: false, error: `سفارشی یافت نشد` });
          return ;
      }

      res.status(200).json({ success: true, data: result });
      return console.log(result);
  });

  
  
  // res.status(200).json({ success: true, data: people })
});


app.get('/api/v1/orderDetails/:orderId',authenticateToken, (req, res) => {


  const { orderId } = req.params;
  

  console.log('hit get orderDetails')

  pool.query(`
 SELECT c.prodId, p.prodName, c.contCount
FROM xicorana.contain c
JOIN xicorana.product p ON c.prodId = p.prodId
WHERE c.ordId = ?;
  `,[orderId],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.length === 0 ){

          res.status(200).json({ success: true, data: "no" });
          return ;
      }

      res.status(200).json({ success: true, data: result });
      return console.log(result);
  });

  
  
  // res.status(200).json({ success: true, data: people })
});




app.get('/api/v1/uidDetails/:uid',authenticateToken, (req, res) => {

  const uid = req.params.uid;
  console.log(uid);

  let queryToRun='';

  const queries = {
      'wsp': `
      SELECT *
      FROM xicorana.wirespool 
      WHERE wspId= ?;

      `,
      'ins': `
      SELECT *
      FROM xicorana.insul 
      WHERE insId= ?;
      `,
      'car': `
      SELECT *
      FROM xicorana.cart 
      WHERE cartId= ?;

      `,
      'fip': `
      SELECT *
      FROM xicorana.finalproduct 
      WHERE fpId= ?;
      `
    };
    
    switch (uid.substring(0, 3)) {
      case 'wsp':
        queryToRun = queries['wsp'];
        break;
      case 'ins':
        queryToRun = queries['ins'];
        break;
      case 'car':
        queryToRun = queries['car'];
        break;
      case 'fip':
        queryToRun = queries['fip'];
        break;
      default:
        res.status(400).json({ success: false, error: 'Invalid uid prefix' });
        return;
    }

  console.log('Executing query:', queryToRun);
  pool.query(queryToRun,[uid],(err,result,fields)=>{
      
      try{

          if(err){
          
              const data = String(err);
              res.status(500).json({ success: false, error: `${data}` });
              return console.log(err);
          
          }
          
          if (result.affectedRows === 0) {
              res.status(404).json({ success: false, error: `اطلاعاتی از چنین محصولی یافت نشد. از درست بودن شناسه اطلاع حاصل` });
              return;
          }else{
              console.log(result);
              res.status(200).json({ success: true, data: result });
          }


      
      }catch(err){
          res.status(500).json({ success: false, error: `${err}` });
      }
  });

  // res.status(200).json({ success: true, data: people })
});






app.get('/api/v1/workplace/:wpId',authenticateToken, (req, res) => {


  const wpId = req.params.wpId;

  console.log('hit get workplace uid')

  pool.query(`
  SELECT wpName,wpType,wpAddress,wpPhoneNumber 
  FROM xicorana.workplace 
  WHERE wpId= ? ;
  `,[wpId],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.length === 0 ){

          res.status(404).json({ success: false, error: `اسم مکان کار یافت نشد` });
          return ;
      }

      res.status(200).json({ success: true, data: result });
      return console.log(result);
  });

  
  
  // res.status(200).json({ success: true, data: people })
});

/////////////////////////////////////////////////////NSFW
app.get('/api/v1/workplace/reverse/:wpName',authenticateToken, (req, res) => {


  const wpName = req.params.wpName;

  console.log('hit get workplace name to wpId')

  pool.query(`
  SELECT wpId,wpName,wpType,wpAddress,wpPhoneNumber 
  FROM xicorana.workplace 
  WHERE wpName= ? ;
  `,[wpName],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.length === 0 ){

          res.status(404).json({ success: false, error: ` مکان کار یافت نشد` });
          return ;
      }

      res.status(200).json({ success: true, data: result });
      return console.log(result);
  });

  
  
  // res.status(200).json({ success: true, data: people })
});


/////////////////////////////////////////////////////NSFW

app.get('/api/v1/workplace',authenticateToken, (req, res) => {


  const wpId = req.params.wpId;

  console.log('hit get workplace uid')

  pool.query(`
  SELECT wpId,wpName,wpType,wpAddress,wpPhoneNumber 
  FROM xicorana.workplace ;
  `,[wpId],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.length === 0 ){

          res.status(404).json({ success: false, error: ` مکان کار یافت نشد` });
          return ;
      }

      res.status(200).json({ success: true, data: result });
      return console.log(result);
  });

  
  
  // res.status(200).json({ success: true, data: people })
});



app.get('/api/v1/pp',authenticateToken, (req, res) => {


  console.log('hit get pp get')

  pool.query(`
  SELECT ppId FROM xicorana.productionplan;
  `,[],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.length === 0 ){

          res.status(404).json({ success: false, error: ` شماره برنامه ای یافت نشد` });
          return ;
      }

      res.status(200).json({ success: true, data: result });
      return console.log(result);
  });

  
  
  // res.status(200).json({ success: true, data: people })
});



app.put('/api/v1/pp/assign/:ppId',authenticateToken, (req, res) => {

  const ppId = req.params.ppId;
  const { uid,ppDevice } = req.body;
  const uid_dash=uid+'-';
  console.log(ppId,uid);

  let queryToRun=[];

  const queries = {
      'wsp': `
      update xicorana.productionplan 
      Set wspId=CONCAT(wspId, ?), ppDevice=?
      where ppId=? and (select wspLL from xicorana.wireSpool where wspId=?)='ورود'; 

      `,
      'ins': `
      update xicorana.productionplan 
      Set insId=CONCAT(insId, ?), ppDevice=?
      where ppId=? and (select insLL from xicorana.insul where insId=?)='ورود';
      `,
      'wsp2': `
      update xicorana.wireSpool set wspLL='مصرف شده' where wspId=?;

      `,
      'ins2': `
      update xicorana.insul set insLL='مصرف شده' where insId=?;
      `
    };
    
    switch (uid.substring(0, 3)) {
      case 'wsp':
        queryToRun[0] = queries['wsp'];
        queryToRun[1] = queries['wsp2'];
        break;
      case 'ins':
        queryToRun[0] = queries['ins'];
        queryToRun[1] = queries['ins2'];
        break;
      default:
        res.status(400).json({ success: false, error: 'Invalid uid prefix' });
        return;
    }

  console.log('Executing query:', queryToRun);
  pool.query(queryToRun[0],[uid_dash,ppDevice,ppId,uid],(err,result,fields)=>{
      
      try{

          if(err){
          
              const data = String(err);
              res.status(500).json({ success: false, error: `${data}` });
              return console.log(err);
          
          }
          
          if (result.affectedRows === 0) {
              res.status(404).json({ success: false, error: `محصولی به برنامه تولید اضافه نشد، از وضعیت کالای تخصیص داده شده اطمینان حاصل فرمایید` });
              return;
          }else{
            

              console.log(result);
              pool.query(queryToRun[1],[uid],(err,result,fields)=>{
                try{

                  if(err){
                  
                      const data = String(err);
                      res.status(500).json({ success: false, error: `${data}` });
                      return console.log(err);
                  
                  }
                }catch(err){
                  res.status(500).json({ success: false, error: `${err}` });
              }
      
                
            });
            res.status(200).json({ success: true, data: `محصول به برنامه تولید اضافه شد` });
          }


      
      }catch(err){
          res.status(500).json({ success: false, error: `${err}` });
      }
  });

  // res.status(200).json({ success: true, data: people })
});



app.get('/api/v1/report/query',authenticateToken, (req, res) => {

  let { wpId,date,sector,material,color,type } = req.query;
  let materialFlag=0;
  let colorFlag=0;
  let typeFlag=0;
  if (!wpId){
    wpId='%';
}else{
    wpId+='%'
}
  if (!date){
    date='%';
}else{
    date+='%'
}
if (!sector){
    sector='%';
}else{
    sector+='%'
}
if (!material){
    material='%';
}else{
    material+='%'
    materialFlag=1
}
if (!color){
    color='%';
}else{
    color+='%'
    colorFlag=1
}
if (!type){
  type='%';
}else{
  type+='%'
  typeFlag=0
}

  pool.query(`select * from xicorana.wireSpool where wpId like ? and wspDate Like ? and WspSector like ? and wspLL='ورود' and wspMaterial like ?;`,[wpId,date,sector,material],(err,result,fields)=>{
      
      try{

          if(err){
          
              const data = String(err);
              res.status(500).json({ success: false, error: `${data}` });
              return console.log(err);
          
          }
          let finalresult=[]
          if (colorFlag===0 && typeFlag===0){
            finalresult[0]=result
          }
          // finalresult[0]=result
      
          let length = result.length;

              pool.query(`select * from xicorana.insul where wpId like ? and insEntryDate Like ? and insSector like ? and insLL='ورود' and insColor like ?;`,[wpId,date,sector,color],(err,result,fields)=>{
      
                try{
          
                    if(err){
                    
                        const data = String(err);
                        res.status(500).json({ success: false, error: `${data}` });
                        return console.log(err);
                    
                    }
                    
                    if (materialFlag===0 && typeFlag===0){
                        finalresult[1]=result
                    }
                    // finalresult[1]=result;
                    length += result.length;
                    pool.query(`select * from xicorana.finalproduct where wpId like ? and fpSector like ? and fpLL='ورود' and fpType like ?;`,[wpId,sector,type],(err,result,fields)=>{
      
                      try{
                
                          if(err){
                          
                              const data = String(err);
                              res.status(500).json({ success: false, error: `${data}` });
                              return console.log(err);
                          
                          }
                          

                          if (materialFlag===0 && colorFlag===0){
                            finalresult[2]=result
                        }
                          // finalresult[2]=result;
                          length += result.length;
                          if(err){
          
                            const data = String(err);
                            res.status(500).json({ success: false, error: `${data}` });
                            return console.log(err);
                            
                        }
                        if(length === 0 ){
                            
                            res.status(404).json({ success: false, error: `کالایی یافت نشد` });
                            return ;
                        }
                        res.status(200).json({ success: true, data: finalresult });

                          return;
                          
                
                
                      
                      }catch(err){
                          res.status(500).json({ success: false, error: `${err}` });
                      }
                  });
                        
                    return;
                    
          
          
                
                }catch(err){
                    res.status(500).json({ success: false, error: `${err}` });
                }
            });

              
              return;


      
      }catch(err){
          res.status(500).json({ success: false, error: `${err}` });
      }
  });

  // res.status(200).json({ success: true, data: people })
});





///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////HERASAT

//get manf name

app.get('/api/v1/manf/name',authenticateToken, (req, res) => {



  console.log('hit get manf name')

  pool.query(`
  SELECT manfName FROM xicorana.manf;
  `,[],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.length === 0 ){

          res.status(404).json({ success: false, error: ` سازنده ای یافت نشد` });
          return ;
      }

      res.status(200).json({ success: true, data: result });
      return console.log(result);
  });

  
  
  // res.status(200).json({ success: true, data: people })
});



app.get('/api/v1/prod/highdemand',authenticateToken, (req, res) => {



  console.log('hit get manf name')

  pool.query(`
  SELECT prodName FROM xicorana.highdemand;
  `,[],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.length === 0 ){

          res.status(404).json({ success: false, error: ` کالای پر استفاده ای یافت نشد` });
          return ;
      }

      res.status(200).json({ success: true, data: result });
      return console.log(result);
  });

  
  
  // res.status(200).json({ success: true, data: people })
});

//get gatheredexit
app.get('/api/v1/gatheredexit',authenticateToken, (req, res) => {


  console.log('hit gatheredexit')

  pool.query(`
  SELECT * 
  FROM xicorana.order 
  WHERE orderSituation = 'Gathered';
  `,[],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.length === 0 ){

          res.status(404).json({ success: false, error: `سفارشی جمع آوری شده و آماده خروج یافت نشد` });
          return ;
      }

      res.status(200).json({ success: true, data: result });
      return console.log(result);
  });

  
  
  // res.status(200).json({ success: true, data: people })
});


app.get('/api/v1/fporder/:orderId',authenticateToken, (req, res) => {


  const orderId = req.params.orderId;
  console.log('hit fporder/:uid')

  pool.query(`
  SELECT * 
  FROM xicorana.sold_finalproduct 
  where orderid=?;
  `,[orderId],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.length === 0 ){

          res.status(404).json({ success: false, error: `اطلاعاتی یافت نشد، وضعیت سفارش را بررسی کنید` });
          return ;
      }

      res.status(200).json({ success: true, data: result });
      return console.log(result);
  });

  
  
  // res.status(200).json({ success: true, data: people })
});





app.put('/api/v1/ordersc/:orderId',authenticateToken, (req, res) => {

  const orderId = req.params.orderId;

  console.log('hit ordersc/:orderId')

  pool.query(`
  update xicorana.order 
  Set orderSituation='Security Checked' 
  where ordId=?;
  `,[orderId],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.affectedRows === 0 ){

          res.status(404).json({ success: false, error: `تغییری انجام نپذیرفت، وضعیت در خواست از قبل تعیین شده و یا ارتباط شما با سرور دچار مشکل شده است` });
          return ;
      }


      res.status(200).json({ success: true, data: " وضغیت سفارش"+orderId+"  به <<تایید حراست>> تغییر کرد" });
      return console.log(result);
  });

  
  
  // res.status(200).json({ success: true, data: people })
});



app.get('/api/v1/ordersc/:orderId',authenticateToken, (req, res) => {

  const orderId = req.params.orderId;

  console.log('hit get ordersc/:orderId')


  pool.query(`
  SELECT orderSituation 
  FROM xicorana.order
  where ordId=? AND orderSituation = 'Security Checked';
  `,[orderId],(err,result,fields)=>{
      console.log(result);
      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.length === 0 ){

          res.status(404).json({ success: false, error: `0` });
          return ;
      }


      res.status(200).json({ success: true, data: "1" });
      return console.log(result);
  });

  
  
  // res.status(200).json({ success: true, data: people })
});



app.post('/api/v1/transports/new',authenticateToken, (req, res) => {


  console.log('hit /transports/new')
  const { tpDriverName, orderId } = req.body
  
  // Check if the username and password are valid
  pool.query(`
  INSERT INTO transports (tpId, orderId, tpDriverName, tpSituation, custAdresse, tpDate)
SELECT 
    CONCAT('tp', FLOOR(RAND() * 1000000)) AS tpId,
    o.ordId AS orderId,
    ? AS tpDriverName,
    'در مسیر' AS tpSituation,
    c.custAdresse AS custAdresse,
    NOW() AS tpDate
FROM xicorana.order o
JOIN customer c ON o.custId = c.custId
WHERE o.ordId = ?
  AND o.orderSituation = 'security Checked'
  ;`,[tpDriverName, orderId],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.affectedRows === 0){

          res.status(401).json({ success: false, error: `عملیات با موفقیت انجام نشد، از وضعیت تایید حراست سفارش اطلاع حاصل فرمایید` });
          return ;
      }


      pool.query(`
        UPDATE xicorana.order
        SET orderSituation = 'exited'
        where ordId=?;
        `,[orderId],(err,result,fields)=>{
      
            if(err){
                
                const data = String(err);
                res.status(500).json({ success: false, error: `${data}` });
                return console.log(err);
                
            }
        });
      
      pool.query(`
        SELECT custAdresse,custMPhone FROM xicorana.customer where custId=(select custId from xicorana.order where ordId=?);
        `,[orderId],(err,result,fields)=>{
      
            if(err){
                
                const data = String(err);
                
      
                res.status(404).json({ success: false, error: `.وضعیت ارسال سفارش مشتری با موفقیت به "در مسیر" تغییر کرد اما ارسال پیامک به شماره ایشان با مشکل مواجه شد` });
                return ;
                
            }
            if(result.length === 0 ){
      
                res.status(404).json({ success: false, error: `وضعیت ارسال سفارش مشتری با موفقیت به "در مسیر" تغییر کرد اما ارسال پیامک به شماره ایشان با مشکل مواجه شد` });
                return ;
            }
            let smsText=''
            let phoneNumber = String(result[0].custMPhone);
            let custAddressn = String(result[0].custAdresse);
            
        smsText=`سفارش به شماره ${orderId} به مقصد ${custAddressn} رهسپار شد. اطلاعات راننده به شرح زیر است:
        ${tpDriverName}
        سامانه ردیابی افشان نگار آریا`
        console.log(smsText);
        
            console.log("clg phonenumber bala: "+phoneNumber);
            
            let axiosFullreq = "https://api.sms-webservice.com/api/V3/Send?ApiKey=@@&SecretKey=@@&Text="+smsText+"&Sender=@number@&Recipients="+phoneNumber;
        console.log("sikooo"+axiosFullreq+"sikooo");
      axios.get(axiosFullreq).then(function(response) {
        console.log(response);
        }).catch(function(error) {
        console.log(error);
        });
        res.status(200).json({ success: true, data: `وضعیت ارسال سفارش مشتری با موفقیت به "در مسیر" تغییر کرد`  });
        return console.log(result);
        });

  });
  
});



app.get('/api/v1/secrequest',authenticateToken, (req, res) => {


  const { userId } = req.query;
  

  console.log('hit get request')

  pool.query(`
  SELECT reqId,reqDate,reqType,reqDetail,reqSender 
  FROM xicorana.request 
  where reqOk='pending' and reqSender=?;
  `,[userId],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.length === 0 ){

          res.status(404).json({ success: false, error: `درخواستی یافت نشد` });
          return ;
      }

      res.status(200).json({ success: true, data: result });
      return console.log(result);
  });

  
  
  // res.status(200).json({ success: true, data: people })
});

app.post('/api/v1/request/new',authenticateToken, (req, res) => {

  const { reqType,reqDetail,userId,reqReciever } = req.body;
  console.log('hit req post')
  
  // Check if the username and password are valid
  pool.query(`
  insert into xicorana.request (reqId, reqDate, reqType, reqDetail, reqSender, reqReciever) values( CONCAT('req', FLOOR(RAND() * 1000000)),NOW(),?,?,?,?);
  ;`,[reqType,reqDetail,userId,reqReciever],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.affectedRows === 0){

          res.status(401).json({ success: false, error: `مشکلی در ایجاد درخواست پیش آمد، از نوشتن توضیحات خیلی بلند خودداری کنید` });
          return ;
      }

      pool.query(`
        SELECT phoneNumber FROM xicorana.user where userId=?;
        `,[reqReciever],(err,result,fields)=>{
      
            if(err){
                
                const data = String(err);
                
      
                res.status(404).json({ success: false, error: `درخواست شما به کاربر ارسال شد اما ارسال پیامک به شماره ایشان با مشکل مواجه شد` });
                return ;
                
            }
            if(result.length === 0 ){
      
                res.status(404).json({ success: false, error: `درخواست شما به کاربر ارسال شد اما ارسال پیامک به شماره ایشان با مشکل مواجه شد` });
                return ;
            }
            let smsText = ""
            let phoneNumber=""
            phoneNumber = String(result[0].phoneNumber);
            
        smsText=`در خواستی مبنی بر ورود کالا به محیط کارخانه به پنل شما ارسال شده است. با ورود به لینک زیر اقدام به تایید یا رد درخواست ثبت شده فرمایید
        https://admin.xikode.lol/
        سامانه ردیابی افشان نگار آریا`
        
            console.log("clg phonenumber bala: "+phoneNumber);
            
            let axiosFullreq = "https://api.sms-webservice.com/api/V3/Send?ApiKey=@@&SecretKey=@@&Text="+smsText+"&Sender=@number@&Recipients="+phoneNumber;
        console.log("sikooo"+axiosFullreq+"sikooo");
      axios.get(axiosFullreq).then(function(response) {
        console.log(response);
        }).catch(function(error) {
        console.log(error);
        });
        res.status(200).json({ success: true, data: " درخواست به کاربر ارسال شد" });
        return console.log(result);
        });
        
    

  });
  
});


app.get('/api/v1/users',authenticateToken, (req, res) => {


  console.log('hit users')

  pool.query(`
  SELECT userId,fullName,username 
  FROM xicorana.user;
  `,[],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.length === 0 ){

          res.status(404).json({ success: false, error: `کاربری یافت نشد` });
          return ;
      }

      res.status(200).json({ success: true, data: result });
      return console.log(result);
  });

  
  
  // res.status(200).json({ success: true, data: people })
});



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////MODIRIAT


app.get('/api/v1/adminrequest/sent',authenticateToken, (req, res) => {


  console.log('hit sent admin req')
  const { userId } = req.query

  pool.query(`
  SELECT * FROM xicorana.request where reqSender=?;
  `,[userId],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.length === 0 ){

          res.status(404).json({ success: false, error: `درخواست ارسالی ای یافت نشد` });
          return ;
      }

      res.status(200).json({ success: true, data: result });
      return console.log(result);
  });

  
  
  // res.status(200).json({ success: true, data: people })
});


app.get('/api/v1/adminrequest/received',authenticateToken, (req, res) => {


  console.log('hit received admin req')
  const { userId } = req.query

  pool.query(`
  SELECT * FROM xicorana.request where reqReciever=? AND reqOk='pending';
  `,[userId],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.length === 0 ){

          res.status(200).json({ success: true, data: result });
          return ;
      }

      res.status(200).json({ success: true, data: result });
      return console.log(result);
  });

  
  
  // res.status(200).json({ success: true, data: people })
});


app.delete('/api/v1/adminrequest/sent/delete/:reqId',authenticateToken, (req, res) => {


  console.log('hit delete admin req')
  const reqId = req.params.reqId;

  pool.query(`
  delete from xicorana.request where reqId=?;
  `,[reqId],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.affectedRows === 0 ){

          res.status(404).json({ success: false, error: `درخواست ارسالی از پیش حذف شده و یا وجود ندارد` });
          return ;
      }

      res.status(200).json({ success: true, data: 'درخواست ارسالی حذف شد' });
      return console.log(result);
  });

  
  
  // res.status(200).json({ success: true, data: people })
});


app.put('/api/v1/adminrequest/received/approve/:reqId',authenticateToken, (req, res) => {


  console.log('hit received admin req approve')
  const reqId = req.params.reqId;

  pool.query(`
  Update xicorana.request Set reqOk='1' where reqId=?;
  `,[reqId],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.affectedRows === 0 ){

          res.status(404).json({ success: false, error: `درخواست از پیش تایید شده و یا از طرف ارسال کننده حذف شده است` });
          return ;
      }

      res.status(200).json({ success: true, data: 'درخواست با موفقیت تایید شد' });
      return console.log(result);
  });

  
  
  // res.status(200).json({ success: true, data: people })
});


app.put('/api/v1/adminrequest/received/deny/:reqId',authenticateToken, (req, res) => {


  console.log('hit received admin req deny')
  const reqId = req.params.reqId;

  pool.query(`
  Update xicorana.request Set reqOk='0' where reqId=? ;
  `,[reqId],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.affectedRows === 0 ){

          res.status(404).json({ success: false, error: `درخواست از پیش رد شده و یا از طرف ارسال کننده حذف شده است` });
          return ;
      }

      res.status(200).json({ success: true, data: 'درخواست با موفقیت رد شد' });
      return console.log(result);
  });

  
  
  // res.status(200).json({ success: true, data: people })
});


app.get('/api/v1/adminreport',authenticateToken, (req, res) => {

  console.log('hit admin report');
  const { searchType,wpId } = req.query
  

  let queryToRun='';

  const queries = {
      'wsp': `
      SELECT *
      FROM xicorana.wirespool 
      WHERE wpId= ?;

      `,
      'ins': `
      SELECT *
      FROM xicorana.insul 
      WHERE wpId= ?;
      `,
      'car': `
      SELECT *
      FROM xicorana.cart 
      WHERE wpId= ?;

      `,
      'fip': `
      SELECT *
      FROM xicorana.finalproduct 
      WHERE wpId= ?;
      `
    };
    
    switch (searchType) {
      case 'wsp':
        queryToRun = queries['wsp'];
        break;
      case 'ins':
        queryToRun = queries['ins'];
        break;
      case 'car':
        queryToRun = queries['car'];
        break;
      case 'fip':
        queryToRun = queries['fip'];
        break;
      default:
        res.status(400).json({ success: false, error: 'Invalid searchType' });
        return;
    }

  console.log('Executing query:', queryToRun);
  pool.query(queryToRun,[wpId],(err,result,fields)=>{
      
      try{

          if(err){
          
              const data = String(err);
              res.status(500).json({ success: false, error: `${data}` });
              return console.log(err);
          
          }
          
          if (result.affectedRows === 0) {
              res.status(404).json({ success: false, error: `مقداری یافت نشد از درست بودن مکان کار اطمینان حاصل نمایید` });
              return;
          }else{
              console.log(result);
              res.status(200).json({ success: true, data: result });
          }


      
      }catch(err){
          res.status(500).json({ success: false, error: `${err}` });
      }
  });

  // res.status(200).json({ success: true, data: people })
});

app.get('/api/v1/adminreport/pp',authenticateToken, (req, res) => {


  const { startDate,endDate } = req.query;
  

  console.log('hit get adminrep pp')

  pool.query(`
  SELECT * FROM xicorana.productionplan WHERE ppMFG BETWEEN ? AND ?;
  `,[startDate,endDate],(err,result,fields)=>{

      if(err){
          
          const data = String(err);
          res.status(500).json({ success: false, error: `${data}` });
          return console.log(err);
          
      }
      if(result.length === 0 ){

          res.status(404).json({ success: false, error: `برنامه تولیدی یافت نشد` });
          return ;
      }

      res.status(200).json({ success: true, data: result });
      return console.log(result);
  });

  
  
  // res.status(200).json({ success: true, data: people })
});



app.get('/api/v1/adminreport/pp/default', authenticateToken, (req, res) => {

  console.log('hit get adminrep pp')

  const {daysBefore} = req.query;

  pool.query(
      `SELECT * FROM xicorana.productionplan WHERE ppMFG BETWEEN DATE_SUB(CURDATE(), INTERVAL ? DAY) AND NOW() ORDER BY ppMFG DESC;`,
      [daysBefore], 
      (err, result,fields) => {
          if (err) {
              console.log(err);
              res.status(500).json({ success: false, error: String(err) });
              return;
          }

          if (result.length === 0) {
              res.status(200).json({ success: true, data: result });
              return;
          }

          console.log(result);
          res.status(200).json({ success: true, data: result });
      }
  );
});



app.get('/api/v1/adminreport/default', authenticateToken, (req, res) => {

  console.log('hit admin report');
  const { searchType } = req.query
  

  let queryToRun='';

  const queries = {
      'wsp': `
      SELECT *
      FROM xicorana.wirespool 
      WHERE wspDate BETWEEN DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND NOW() ORDER BY wspDate DESC;

      `,
      'ins': `
      SELECT *
      FROM xicorana.insul 
      WHERE insEntryDate BETWEEN DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND NOW() ORDER BY insEntryDate DESC;
      `,
      'car': `
      SELECT *
      FROM xicorana.cart 
      WHERE cartMFG BETWEEN DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND NOW() ORDER BY cartMFG DESC;

      `,
      'fip': `
      SELECT *
      FROM xicorana.finalproduct 
      limit 10;
      `
    };
    
    switch (searchType) {
      case 'wsp':
        queryToRun = queries['wsp'];
        break;
      case 'ins':
        queryToRun = queries['ins'];
        break;
      case 'car':
        queryToRun = queries['car'];
        break;
      case 'fip':
        queryToRun = queries['fip'];
        break;
      default:
        res.status(400).json({ success: false, error: 'Invalid searchType' });
        return;
    }

  console.log('Executing query:', queryToRun);
  pool.query(queryToRun,[],(err,result,fields)=>{
      
      try{

          if(err){
          
              const data = String(err);
              res.status(500).json({ success: false, error: `${data}` });
              return console.log(err);
          
          }
          
          if (result.affectedRows === 0) {
              res.status(404).json({ success: true, data: result });
              return;
          }else{
              console.log(result);
              res.status(200).json({ success: true, data: result });
          }


      
      }catch(err){
          res.status(500).json({ success: false, error: `${err}` });
      }
  });

  // res.status(200).json({ success: true, data: people })
});


app.get('/api/v1/adminreport/order/submitted/counter', authenticateToken, (req, res) => {

  console.log('hit get adminrep order submitted counter')


  pool.query(
      `SELECT count(ordId) AS counted FROM xicorana.order where orderSituation='submitted';`,
      [], 
      (err, result,fields) => {
          if (err) {
              console.log(err);
              res.status(500).json({ success: false, error: String(err) });
              return;
          }

          if (result.length === 0) {
              res.status(200).json({ success: true, data: result });
              return;
          }

          console.log(result);
          res.status(200).json({ success: true, data: result });
      }
  );
});



app.get('/api/v1/adminreport/order/gathered/counter', authenticateToken, (req, res) => {

  console.log('hit get adminrep order gathered countered')


  pool.query(
      `SELECT count(ordId) AS counted FROM xicorana.order where orderSituation='Gathered';`,
      [], 
      (err, result,fields) => {
          if (err) {
              console.log(err);
              res.status(500).json({ success: false, error: String(err) });
              return;
          }

          if (result.length === 0) {
              res.status(200).json({ success: true, data: result });
              return;
          }

          console.log(result);
          res.status(200).json({ success: true, data: result });
      }
  );
});


app.get('/api/v1/adminreport/order/exited/counter', authenticateToken, (req, res) => {

  console.log('hit get adminrep order gathered countered')


  pool.query(
      `SELECT COUNT(ordId) AS counted FROM xicorana.order WHERE orderSituation = 'exited' AND orderDate >= DATE_SUB(CURDATE(), INTERVAL 1 WEEK);`,
      [], 
      (err, result,fields) => {
          if (err) {
              console.log(err);
              res.status(500).json({ success: false, error: String(err) });
              return;
          }

          if (result.length === 0) {
              res.status(200).json({ success: true, data: result });
              return;
          }

          console.log(result);
          res.status(200).json({ success: true, data: result });
      }
  );
});



app.get('/api/v1/adminreport/cart/length', authenticateToken, (req, res) => {

  console.log('hit get adminrep order gathered countered')


  pool.query(
      `SELECT cartLenght FROM xicorana.cart WHERE cartMFG >= DATE_SUB(CURDATE(), INTERVAL 1 WEEK);`,
      [], 
      (err, result,fields) => {
          if (err) {
              console.log(err);
              res.status(500).json({ success: false, error: String(err) });
              return;
          }

          if (result.length === 0) {
              res.status(200).json({ success: true, data: 0 });
              return;
          }

          console.log(result);
          let forLength = parseInt(result.length)
          console.log(forLength);
          let cartLenght = 0

          for (let i = 0; i < forLength; i++) {
              console.log(result[i].cartLenght);
              cartLenght += parseInt(result[i].cartLenght);
          }

          res.status(200).json({ success: true, data: cartLenght });
      }
  );
});



app.get('/api/v1/adminreport/warehouse/stock', authenticateToken, (req, res) => {


  let {wpId} = req.query;
  if (!wpId){


    wpId = 'wp1'

  }

  console.log('hit get adminrep warehouse/stock')


  pool.query(
      `SELECT 
    (SELECT COUNT(wspId) FROM xicorana.wirespool WHERE wpId = ?) AS wireSpoolCount,
    (SELECT COUNT(insId) FROM xicorana.insul WHERE wpId = ?) AS InsulCount,
    (SELECT COUNT(cartId) FROM xicorana.cart WHERE wpId = ?) AS cartCount;`,
      [wpId,wpId,wpId], 
      (err, result,fields) => {
        if (err) {
          console.log(err);
          res.status(500).json({ success: false, error: String(err) });
          return;
      }

      if (result.length === 0) {
          res.status(200).json({ success: true, data: result });
          return;
      }

      console.log(result);
      res.status(200).json({ success: true, data: result });
      }
  );
});

app.get('/api/v1/adminreport/noQC', authenticateToken, (req, res) => {

  console.log('hit get adminrep noQC')


  pool.query(
      `SELECT 
    (SELECT COUNT(wspId) FROM xicorana.wirespool WHERE wspQC = '0') AS wireSpoolCount,
    (SELECT COUNT(insId) FROM xicorana.insul WHERE insQC = '0') AS InsulCount,
    (SELECT COUNT(cartId) FROM xicorana.cart WHERE cartQc = '0') AS cartCount;`,
      [], 
      (err, result,fields) => {
          if (err) {
              console.log(err);
              res.status(500).json({ success: false, error: String(err) });
              return;
          }

          if (result.length === 0) {
              res.status(200).json({ success: true, data: result });
              return;
          }

          console.log(result);
          res.status(200).json({ success: true, data: result });
      }
  );
});




app.get('/api/v1/adminreport/order/lastOfUs', authenticateToken, (req, res) => {

  console.log('hit get adminrep order Last Of Us: Part I')


  pool.query(
      `SELECT * FROM xicorana.order ORDER BY orderDate DESC limit 5;`,
      [], 
      (err, result,fields) => {
          if (err) {
              console.log(err);
              res.status(500).json({ success: false, error: String(err) });
              return;
          }

          if (result.length === 0) {
              res.status(200).json({ success: true, data: result });
              return;
          }

          console.log(result);
          res.status(200).json({ success: true, data: result });
      }
  );
});

app.get('/api/v1/adminreport/order/lastOfUs2', authenticateToken, (req, res) => {

  console.log('hit get adminrep order Last Of Us: Part II')


  pool.query(
      `SELECT * FROM xicorana.order WHERE orderSituation = 'exited' ORDER BY orderDate DESC limit 5;`,
      [], 
      (err, result,fields) => {
          if (err) {
              console.log(err);
              res.status(500).json({ success: false, error: String(err) });
              return;
          }

          if (result.length === 0) {
              res.status(200).json({ success: true, data: result });
              return;
          }

          console.log(result);
          res.status(200).json({ success: true, data: result });
      }
  );
});

app.get('/api/v1/adminreport/highDemandChart', authenticateToken, (req, res) => {

  console.log('hit get adminrep highdemandchart')


  pool.query(
      `SELECT 
    p.prodName,
    SUM(c.contCount) AS totalCount
FROM 
    xicorana.contain c
JOIN 
    xicorana.product p ON c.prodId = p.prodId
GROUP BY 
    c.prodId, p.prodName;`,
      [], 
      (err, result,fields) => {
          if (err) {
              console.log(err);
              res.status(500).json({ success: false, error: String(err) });
              return;
          }

          if (result.length === 0) {
              res.status(200).json({ success: true, data: result });
              return;
          }

          console.log(result);
          res.status(200).json({ success: true, data: result });
      }
  );
});




//start the https server
const PORT = 5000;
// httpsServer.listen(PORT, '0.0.0.0', () => {
//     console.log(`HTTPS Server running on https://0.0.0.0:${PORT}`);
// });
app.listen(PORT,()=>{

    console.log('server running on port ' + PORT )
})


