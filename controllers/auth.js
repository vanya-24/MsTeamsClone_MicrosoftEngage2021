const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require("passport");

// create connection
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,    // or add ip address
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
  });


exports.register = (req,res) => {
    console.log(req.body);

const { username,user_email,user_password,user_passwordConfirm } = req.body; 

db.query('SELECT email FROM users WHERE email = ?', [user_email], async (err,result) =>{
    if(err){
        console.log(err);
    } 
    if(result.length > 0){
        return res.render('register',{
            message : 'Email already in use'
        })
    } else if(user_password !== user_passwordConfirm){
        return res.render('register',{
            message: 'Passwords do not match'
        });
    }

   let hashedPassword = await bcrypt.hash(user_password,8);
   console.log(hashedPassword);

   db.query('INSERT INTO users SET ?',{ name: username, email:user_email, password: hashedPassword }, (err,result)=>{
       if(err){
           console.log(err);
       } else{
           console.log(result)

           db.query('SELECT LAST_INSERT_ID() as user_id', function(err,result){
                if(err){
                    console.log(err);
                    throw err;
                }
                else{
                    const user_id = result[0];
                    req.login(user_id, function(err){
                        res.redirect('/')
                    })
                }
           });
       }
   }) 
});

passport.serializeUser(function(user_id,done){
    done(null,user_id)
});

passport.deserializeUser(function(user_id,done){
    done(null,user_id);
});

}