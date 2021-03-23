const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require("../models/user");
const bcrypt = require("bcrypt");

const verifyCallback = async (username, password, done) => {
    //checks if user is in database
    User.findOne({_id: username})
        .then((user)  => {
            console.log(user._id,user.password,password)
           if(!user){
               return done(null,false,{message:'incorrect username'});
           }
           //checks if password provided is valid
           const isValid = bcrypt.compare(password, user.password);
           console.log(isValid);
           if(isValid){
               return done(null,user);
           }else{
               return done(null,false), {message:'incorrect password'};
           }
        })
        .catch((err) =>{
            done(err);
        });
}

//const strategy = new LocalStrategy(verifyCallback);
passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    //passReqToCallback: true
},
    verifyCallback));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((userId, done) =>{
    User.findById(userId)
        .then((user) =>{
            done(null,user);
        })
        .catch(err => done(err));
});