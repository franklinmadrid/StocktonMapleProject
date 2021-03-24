const express = require('express');
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Tree = require("../models/tree");
const router = express.Router();
const passport = require('passport');


//-------------Post routes--------------------//

router.post('/login',
    passport.authenticate('local',{failureRedirect: "/", failureFlash: true}), (req,res) => {
        res.redirect("/users/" + req.user._id);
    }
);

router.post('/users/registerTrees',async (req, res) => {
    try{
        req.body.user= req.user._id;
        const tree = new Tree(req.body);
        tree.save()
            .then((result) => {
                console.log(req.user);
                //console.log(req.session.Session);
                res.redirect("/users/" + req.user._id);
            })
            .catch((err) => console.log(err));
    } catch{
        res.status(500);
    }
});

//-----------------------get routes--------------------------//

router.get('/users/registerTree', (req,res) => {
    res.render('registerTree');
});


router.get('/users/:id', async (req,res) =>{
    const id = req.params.id;
    await User.findById(id)
        .then(result => {
            if(result == null){
                res.status(404).send('404 error') ;
            }
            res.render('user',{user: result, title: result._id + "'s profile"})
        })
        .catch(err => {
            console.log(err);
        });
});

module.exports= router;
