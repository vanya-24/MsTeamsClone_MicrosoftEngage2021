const express = require('express')
const multer = require('multer');
const nodemailer = require('nodemailer');
const fs = require('fs');  // built in nodejs module
const router = express.Router();
const dotenv = require('dotenv');
const mysql = require('mysql');
//  connect to database
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,    // or add ip address
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
});

db.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    // console.log("MYSQL connected...")
  }
});



dotenv.config({ path: '../.env' })

 function authenticationMiddleware() {
    return (req,res,next) =>{
        console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);
        if(req.isAuthenticated())
        return next();
        res.redirect('/login')
    }
  }
router.get('/register', (req, res) => {
    res.render('register');
  })
  
  router.get('/login', (req, res,next) => {
    res.render('login');
  })
  router.get('/logout',  (req, res) => {
    req.logout();
    req.session.destroy();
    res.redirect('/');
  })

  router.get('/organise', authenticationMiddleware(), (req, res,next) => {
    res.render('organise');
  });

  router.get('/invite',authenticationMiddleware(),(req,res)=>{
    res.render('invite')
  });

  router.get('/chatform',authenticationMiddleware(),(req,res)=>{
    res.render('chatform')
  });

  router.get('/chatroom',authenticationMiddleware(),(req,res)=>{
    res.render('chatroom')
  });

  router.get('/', (req, res) => {
    // res.render('home');
    console.log(req.user)
    console.log(req.isAuthenticated())
    res.render('home');
});

  router.get('/result',(req,res)=>{
    res.render('result')
  })

  

  router.get('/help',(req,res)=>{
    res.render('help')
  });





  


  var to;
  var subject;
  var body;
  var path;
  
  const Storage =multer.diskStorage({
    destination: function(req,file,callback){
      callback(null,'./image');
    },
    filename:function(req,file,callback){
      callback(null,file.filename + "_" + Date.now() + "_" + file.originalname)
    },
  });
  
  const upload = multer({
    storage:Storage
  }).single('image');
  
  router.post('/sentmail',(req,res)=>{
  
        // execute this middleware to upload the image
  
        upload(req,res,function(err){
          if(err){
            console.log(err)
            return res.end('Something went wrong');
          }
          else{
            to = req.body.to
            subject = req.body.subject
            body = req.body.body
  
            path = req.file.path
  
            console.log(to);
            console.log(subject)
            console.log(body)
            console.log(path)
           
             var transporter = nodemailer.createTransport({
                service:'gmail',
                auth:{
                  user:'aroravanya71@gmail.com',
                  pass:process.env.EMAIL_PASSWORD,
                }
              });
            var mailOptions = {
              from:'aroravanya71@gmail.com',
              to:to,
              subject:subject,
              text:body,
              attachments:[
                {
                  path:path
                }
              ]
            }
            transporter.sendMail(mailOptions,function(err,info){
              if(err){
                console.log(err);
              }else{
                console.log('email-sent' + info.response);
                 fs.unlink(path,function(err){
                   if(err){
                     return res.end(err)
                   }
                   else{
                     console.log("deleted");
                     return res.redirect('/result');
                   }
                 }) 
              }
            })
          }
        })
  
    })
  

  module.exports = router;
  