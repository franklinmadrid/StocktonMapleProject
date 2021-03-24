const express = require('express');
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Tree = require("../models/tree");
const router = express.Router();
const passport = require('passport');
const {isAuth, isAdmin} = require('./authMiddleware');

// /user/* routes and user-related routes such as /login, /logout

//-------------Post routes--------------------//

router.post('/login',
    passport.authenticate('local',{failureRedirect: "/", failureFlash: true}), (req,res) => {
        res.redirect("/users/" + req.user._id);
    }
);

router.post('/users/registerTree', async (req, res) => {
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
router.get('/logout',(req, res) => {
    req.logout();
    res.redirect('/');
});

router.get('/users/:id', async (req,res) =>{
    const id = req.params.id;
    await User.findById(id)
        .then(result => {
            if(result == null){
                res.status(404).send('404 error') ;
            }
            console.log('result',result);
            res.render('user',{user: result, title: result._id + "'s profile"})
        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/registerTree',isAuth, (req,res) => {
    res.render('registerTree',{link:'users/' + req.user._id});
});


module.exports= router;
