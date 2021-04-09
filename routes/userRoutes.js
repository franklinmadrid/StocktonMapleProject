const express = require('express');
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Tree = require("../models/tree");
const Sap = require("../models/sap");
const Syrup = require("../models/syrup");
const router = express.Router();
const passport = require('passport');
const {isAuth, isAdmin} = require('./authMiddleware');
const excel = require('exceljs');

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
            console.log(result);
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

router.get('/admin',isAdmin, (req,res) => {
    res.render('admin',{user: req.user._id });
});

router.get('/admin/download', isAdmin, async (req,res) =>{
    let workbook = new excel.Workbook(); //creating workbook
    let trees = workbook.addWorksheet('Trees'); //creating worksheet
    let saps = workbook.addWorksheet('Saps');
    let syrups = workbook.addWorksheet('Syrups');
    //  WorkSheet Header
    trees.columns = [
        { header: 'Name', key: '_id', width: 10 },
        { header: 'Circumf', key: 'circumf', width: 10 },
        { header: 'Stem Count', key: 'stemCount', width: 10},
        { header: 'Tapping Date', key: 'tappingDate', width: 10},
        { header: 'Tap Height', key: 'tapHeight', width: 10 },
        { header: 'Latitude', key: 'latitude', width: 10 },
        { header: 'Longitude', key: 'longitude', width: 10},
        { header: 'Start of Season Notes', key: 'startNotes', width: 30},
        { header: 'End of Season Notes', key: 'endNotes', width: 30}

    ];
    saps.columns = [
        { header: 'Tree', key: 'tree', width: 10 },
        { header: 'Volume', key: 'sapVolume', width: 10 },
        { header: 'Harvest Date', key: 'harvestDate', width: 10},
        { header: 'Harvest Temp', key: 'harvestTemp', width: 10},
    ];
    syrups.columns = [
        { header: 'Syrup produced', key: 'syrupProduced', width: 10 },
        { header: 'Sap Processed', key: 'sapProcessed', width: 10 },
        { header: 'Sap Lost', key: 'sapLost', width: 10},
        { header: 'Processing Date', key: 'processingDate', width: 15},
        { header: 'Hours', key: 'hours', width: 10},
        { header: 'Minutes', key: 'minutes', width: 10},
        { header: 'Fuel Type', key: 'fuelType', width: 15}
    ]
    await Tree.find({})
        .then(result =>{
            trees.addRows(result);
        });
    await Sap.find({})
        .then(result =>{
            saps.addRows(result);
        });
    await Syrup.find({})
        .then(result =>{
            syrups.addRows(result);
        });
    workbook.xlsx.writeFile("./Data/Data.xlsx")
        .then(function() {
            console.log("file saved!");
            res.download("./Data/Data.xlsx");
        });

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
    res.render('registerSyrup',{
            profileLink: 'http://localhost:3000/users/' + req.user._id
    });
});

router.get('/users/:id/syrup', isAuth, async (req,res) => {
    const id = req.params.id;
    await Syrup.find({user: id})
        .then(result => {
            res.render('syrup', {
                link: 'http://localhost:3000/users/' + id,
                user: id,
                syrupData: result
            });
        })
});

router.get('/forumHome', isAuth, (req, res) => {
    res.render('forumHome', {
        link: 'http://localhost:3000/',
        profileLink: 'http://localhost:3000/users/' + req.user._id
    });
});

router.get('/trees/:id',isAuth, async (req,res) => {
    const id = req.params.id;
    await Tree.findById(id)
        .then(async result => {
            if(result == null){
                res.status(404).send('404 error') ;
            }
            if (result.user == req.user._id){
                const currentSeason = result.season;
                await Sap.find({'tree' : id})
                    .then(sapList =>{
                        let entryLink = 'trees/' + id + 'registerHarvest';
                        res.render('tree',{link:'http://localhost:3000/users/' + req.user._id,
                            entryLink: entryLink,
                            treeID: req.params.id,
                            saps: sapList,
                            currentSeason: currentSeason,
                            tree: result
                        });
                    });
            }else{
                res.status(401).send('Not authorized to access this resource.') ;
            }
        })
        .catch(err => {
            console.log(err);
        });
});

module.exports= router;
