const express = require('express');
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Tree = require("../models/tree");
const router = express.Router();
const passport = require('passport');
const bodyParser = require('body-parser');
const {check, validationResult} = require('express-validator');

const urlencodedParser = bodyParser.urlencoded({extended:false});

//-----------Post Routes---------------------//

//saves new user to db
router.post('/register', urlencodedParser, [
    check('_id', 'The username must be 4+ characters long')
        .exists()
        .isLength({min:4}),
    check('email', 'Email is not valid')
        .isEmail()
        .normalizeEmail()
], async (req,res) =>{
    const errors = validationResult(req);
    let alert = errors.array();
    await User.find({email: req.body.email})
        .then(result => {
            if(result.length > 0){
                alert.push({msg: 'This email is already in use'});
            }
        });
    await User.find({_id: req.body._id})
        .then(result => {
            if(result.length > 0){
                alert.push({msg: 'This username is already in use'});
            }
        });
    if(req.body.password !== req.body.password1) {
        alert.push({msg: 'Passwords do not match'});
    }
    if(alert.length > 0) {
        res.render('register', {
            alert
        })
    }
    else {
        try{
            await bcrypt.hash(req.body.password, 10, function (err,hash){
                req.body.password = hash;
                req.body.admin = false;
                req.body.moderator = false;
                const user = new User(req.body);
                user.save()
                    .then((result) => {
                        res.redirect("/");
                    })
                    .catch((err) => console.log(err));
            })
        } catch{
            res.status(500);
        }
    }
});


//-----------------Get Routes-------------------//

router.get('/register',(req,res) =>{
    res.render('register');
});



//export
module.exports= router;