const express = require('express');
const passport = require('passport');
const authController = require('../controllers/auth');
const router = express.Router();

  
router.post('/login', passport.authenticate(
  'local',{
    successRedirect:'/',
    failureRedirect:'/login',
  }
));

  router.post('/register', authController.register);
  
  passport.serializeUser(function(user_id,done){
    done(null,user_id)
});

passport.deserializeUser(function(user_id,done){
    done(null,user_id);
});

module.exports = router;