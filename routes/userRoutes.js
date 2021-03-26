const express = require('express');
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Tree = require("../models/tree");
const Sap = require("../models/sap");
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
                res.redirect("/users/" + req.user._id);
            })
            .catch((err) => console.log(err));
    } catch{
        res.status(500);
    }
});

router.post('/users/registerHarvest', async (req, res) => {
    try{
        //gets harvestTemp from api.weather.gov using tree coords
        let harvestTemp;
        await Tree.findById(req.body.tree)
            .then(result =>{
                let url = "https://api.weather.gov/points/";
                url.concat(result.latitude,',',result.longitude);
                $.getJSON(url, data =>{
                    const forecastURL = data.properties.forecast;
                    $.getJSON(forecastURL,data =>{
                        harvestTemp = data.properties.periods[0].temparature;
                    });
                });
            });
        req.body.harvestTemp = harvestTemp;
        console.log(req.body);
        const sap = new Sap(req.body);
        sap.save()
            .then((result) => {
                res.redirect("/users/" + req.user._id);
            })
            .catch((err) => console.log(err));
    } catch{
        res.status(500);
    }
});

router.post('/:id/registerHarvest', async (req, res) => {
    try{

        req.body.harvestTemp=
        console.log(req.body);
        const tree = new Tree(req.body);
        tree.save()
            .then((result) => {
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
            Tree.find({"user":id})
                .then(treeList =>{
                    res.render('user',{user: result, title: result._id + "'s profile", trees: treeList});
                })
        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/registerTree',isAuth, (req,res) => {
    res.render('registerTree',{link:'users/' + req.user._id});
});

// route=  /treeID/registerHarvest
router.get('/:id/registerHarvest',isAuth, (req,res) => {
    res.render('registerHarvest',{link:'users/' + req.user._id, treeID: req.params.id});
});


module.exports= router;
