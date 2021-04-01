const express = require('express');
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Tree = require("../models/tree");
const Sap = require("../models/sap");
const Syrup = require("../models/syrup");
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

router.post('/users/registerTree',isAuth, async (req, res) => {
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

router.post('/users/registerHarvest',isAuth, async (req, res) => {
    console.log(req.body);
    const treeID = req.body.tree;
    await Tree.findById(treeID)
        .then(result =>{
            const season = result.season;
            let sap = new Sap(req.body);
            sap.season = season;
            sap.save()
                .then(() => {
                    res.redirect("/trees/" + sap.tree);
                })
                .catch((err) => console.log(err));
        })
        .catch(err =>{
            console.log(err);
        });


});

router.post('/registerSyrup',isAuth, (req, res) => {
    console.log(req.body);
    req.body.user = req.user._id;
    console.log(req.body);
    const syrup = new Syrup(req.body);
    console.log(syrup);
    syrup.save()
        .then(() =>{
           res.redirect('http://localhost:3000/users/' + req.user._id);
        })
        .catch(err =>{
            console.log(err);
        });
});

router.post('/trees/:id/endTreeSeason',isAuth, async (req, res) => {
    const id = req.body._id;
    console.log(id);
    await Tree.updateOne({_id:id}, {$inc: { season: 1}, lastFlowDate: req.body.lastFlowDate, endNotes: req.body.endNotes});
    res.redirect('http://localhost:3000/trees/' + id);
});

//-----------------------get routes--------------------------//
router.get('/logout',(req, res) => {
    req.logout();
    res.redirect('/');
});

router.get('/login', (req, res) => {
    res.render('login',{message: req.flash("error")});
});

router.get('/users/:id', async (req,res) =>{
    const id = req.params.id;
    await User.findById(id)
        .then(result => {
            if(!result){
                res.status(404).send('404 error') ;
            }
            Tree.find({"user":id})
                .then(treeList =>{
                    res.render('user',{user: result, title: result._id + "'s profile", trees: treeList});
                })
                .catch((err) =>{
                    console.log(err);
                });
        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/registerTree',isAuth, (req,res) => {
    res.render('registerTree',{link:'users/' + req.user._id});
});


router.get('/trees/:id/registerHarvest',isAuth, async (req,res) => {
    const id = req.params.id;
    await Tree.findById(id)
        .then(result => {
            res.render('registerHarvest', {
                link: 'http://localhost:3000/users/' + req.user._id,
                treeID: req.params.id,
                coords: [result.latitude,result.longitude]})
        })
        .catch(err =>{console.log(err)});
});

router.get('/trees/:id/endTreeSeason', isAuth, async (req,res) => {
    const id = req.params.id;
    await Tree.findById(id)
        .then(result => {
            res.render('endTreeSeason', {
                link: 'http://localhost:3000/trees/' + id,
                treeID: req.params.id,
                });
        })
        .catch(err =>{console.log(err)});
});

router.get('/registerSyrup', isAuth,(req,res) => {
    res.render('registerSyrup');
});

router.get('/trees/:id',isAuth, async (req,res) => {
    const id = req.params.id;
    await Tree.findById(id)
        .then(async result => {
            if(result == null){
                res.status(404).send('404 error') ;
            }
            if (result.user == req.user._id){
                const season = result.season;
                await Sap.find({'tree' : id, 'season': season})
                    .then(sapList =>{
                        let entryLink = 'trees/' + id + 'registerHarvest';
                        res.render('tree',{link:'http://localhost:3000/users/' + req.user._id,entryLink: entryLink, treeID: req.params.id, saps: sapList});
                    });
            }else{
                res.status(401).send('Not authorized to access this resource.') ;
            }
        })
        .catch(err => {
            console.log(err);
        });
});

router.get("/logs", isAuth, (req, res) =>{
   res.render("logs");
});

module.exports= router;
