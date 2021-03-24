const express = require('express');
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Tree = require("../models/tree");
const router = express.Router();
const passport = require('passport');

//-----------Post Routes---------------------//

//saves new user to db
router.post('/register',async (req,res) =>{
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        req.body.password = hashedPassword;
        req.body.admin = false;
        req.body.moderator = false;
        const user = new User(req.body);
        user.save()
            .then((result) => {
                res.redirect("/");
            })
            .catch((err) => console.log(err));
    } catch{
        res.status(500);
    }
});


//-----------------Get Routes-------------------//

router.get('/register',(req,res) =>{
    res.render('register');
});



//export
module.exports= router;