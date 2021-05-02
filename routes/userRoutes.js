const mongoose = require("mongoose");
const express = require('express');
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Tree = require("../models/tree");
const Sap = require("../models/sap");
const Syrup = require("../models/syrup");
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const {isAuth, isAdmin} = require('./authMiddleware');
const excel = require('exceljs');
const Group = require("../models/group");
const Category = require("../models/category");
const Post = require("../models/post");
const Thread = require("../models/thread");

require('dotenv').config();

// /user/* routes and user-related routes such as /login, /logout

//-------------Post routes--------------------//

router.post('/login',
    passport.authenticate('local',{failureRedirect: "/login", failureFlash: true}), (req,res) => {
        res.redirect("/users/" + req.user._id);
    }
);

//----------Several Attempts to fix /login (local strategy is most promising)-----------//

// router.post('/login',
//     passport.authenticate('local'), (req,res) => {
//         alert = [];
//         const username = req.body.username;
//         User.findById(username)
//             .then(result => {
//                 if(result){
//                     res.redirect("/users/" + req.user._id);
//                 }else{
//                     alert.push({msg: "That username doesn't exist"});
//                     res.render('login', {alert});
//                 }
//             });
//     });


// passport.use(new LocalStrategy(
//     function(username, password, done) {
//         User.findOne({ username: username }, function (err, user) {
//             console.log(username);
//             alert = [];
//             if (err) { return done(err); }
//             if (!user) {
//                 alert.push({msg: "The username doesn't exist"});
//                 return done(null, false, {message: "The username doesn't exist"});
//             }
//             if (!user.verifyPassword(password)) {
//                 alert.push({msg: "Incorrect password"})
//                 return done(null, false, {message: "Incorrect password"});
//             }
//             return done(null, user);
//             });
//      }
// ));

// router.post('/login', 
//     passport.authenticate('local',
//         (req, res) => {
//             res.redirect('/');
//         })
// );

// router.post('/login', 
//     passport.authenticate('local', {failureRedirect: '/login'}),
//     function(req, res) {
//         res.redirect('/');
//     }
// );


router.post('/users/registerTree',isAuth, async (req, res) => {
    try{
        Tree.findById(req.body._id)
            .then(result =>{
                if(!result){
                    req.body.user= req.user._id;
                    let tapDate = req.body.tappingDate;
                    req.body.tappingDate = null;
                    let startNotes = req.body.startNotes
                    req.body.startNotes = [];
                    const tree = new Tree(req.body);
                    tree.Tapped = true;
                    tree.firstFlowDate = [];
                    tree.lastFlowDate = [];
                    tree.tappingDates.push(tapDate);
                    tree.startNotes.push(startNotes);
                    let year = tapDate.toString().substr(0,4)
                    tree.season.push(year);
                    tree.save()
                        .then((result) => {
                            res.redirect("/users/" + req.user._id);
                        })
                        .catch((err) => console.log(err));
                }else{
                    let alert = 'Tree already exist';
                    res.render("registerTree",{link:/users/+ req.user._id,alert});
                }
            });
    } catch{
        res.status(500);
    }
});

router.post('/users/registerHarvest',isAuth, async (req, res) => {
    const treeID = req.body.tree;
    await Tree.findById(treeID)
        .then(async result =>{
            const currentSeason = result.season[result.season.length -1];
            await Sap.find({tree:treeID,season:currentSeason})
                .then(sapResult =>{
                    if(sapResult.length > 0){//not first sap entry for the season
                        let sap = new Sap(req.body);
                        sap.season = currentSeason;
                        sap.save()
                            .then(() => {
                                res.redirect("/trees/" + sap.tree);
                            })
                            .catch((err) => console.log(err));
                    }else{//first sap entry for the season
                        let sap = new Sap(req.body);
                        sap.season = currentSeason;
                        result.firstFlowDate.push(sap.harvestDate);
                        result.save()
                            .then(()=>{
                                sap.save()
                                    .then(() => {
                                        res.redirect("/trees/" + sap.tree);
                                    })
                                    .catch((err) => console.log(err));
                            });
                    }
                });
        })
        .catch(err =>{
            console.log(err);
        });
});

router.post('/registerSyrup',isAuth, (req, res) => {
    req.body.user = req.user._id;
    const syrup = new Syrup(req.body);
    syrup.save()
        .then(() =>{
           res.redirect('/users/' + req.user._id);
        })
        .catch(err =>{
            console.log(err);
        });
});

router.post('/trees/:id/endTreeSeason',isAuth, async (req, res) => {
    const id = req.body._id;
    await Tree.findById(id)
        .then( async result =>{
            await Sap.find({tree:id,season:result.season[result.season.length - 1]}).sort({harvestDate:-1}).limit(1)
                .then(sap =>{
                    if(sap.length > 0){// has sap entries
                        result.lastFlowDate.push(sap[0].harvestDate);
                        result.Tapped = false;
                        result.endNotes.push(req.body.endNotes);
                        result.save()
                        res.redirect("/trees/" + id);
                    }else{
                        result.firstFlowDate.push(null);
                        result.lastFlowDate.push(null);
                        result.endNotes.push(req.body.endNotes);
                        result.Tapped = false;
                        result.save()
                        res.redirect("/trees/" + id);
                    }

                }).catch(err =>{
                   console.log(err);
                });

        })
        .catch(err => {
        console.log(err);
    })
    res.redirect('/trees/' + id);
});

router.post('/trees/:id/startTreeSeason',isAuth, async (req, res) => {
    const id = req.body._id;
    await Tree.findById(id)
        .then( async result =>{
            result.tappingDates.push(req.body.tappingDate);
            result.startNotes.push(req.body.startNotes);
            let year = req.body.tappingDate.toString().substring(0,4)
            result.season.push(year);
            result.Tapped = true;
            result.save()
                .then( () =>{
                   res.redirect('/trees/' + id);
                });
        })
        .catch(err => {
            console.log(err);
        })
    res.redirect('/trees/' + id);
});

router.post("/admin/makeAdmin", async (req,res) =>{
    let alert=[];
   const username = req.body.username;
   User.findById(username)
       .then(result =>{
           if(!result){
               alert.push({msg:"Username not Found"})
               res.render("admin",{user:req.user._id, alert})
           }else{
               result.admin = true;
               result.save();
               res.render("admin",{user:req.user._id, alert})
           }
       })
});

router.post("/admin/makeMod", async (req,res) =>{
    let alert=[];
    const username = req.body.username;
    User.findById(username)
        .then(result =>{
            if(!result){
                alert.push({msg:"Username not Found"})
                res.render("admin",{user:req.user._id, alert})
            }else{
                result.moderator = true;
                result.save();
                res.render("admin",{user:req.user._id, alert})
            }
        })
});

router.post("/admin/removeMod", async (req,res) =>{
    let alert=[];
    const username = req.body.username;
    console.log(username);
    User.findById(username)
        .then(result =>{
            console.log(result);
            if(!result){
                alert.push({msg:"Username not Found"})
                res.render("admin",{user:req.user._id, alert})
            }else{
                result.moderator = false;
                result.save();
                res.render("admin",{user:req.user._id, alert})
            }
        })
});

router.post("/admin/removeAdmin", async (req,res) =>{
    let alert=[];
    const username = req.body.username;
    User.findById(username)
        .then(result =>{
            if(!result){
                alert.push({msg:"Username not Found"})
                res.render("admin",{user:req.user._id, alert})
            }else{
                result.admin = false;
                result.save();
                res.render("admin",{user:req.user._id, alert})
            }
        })
});

router.post("/admin/delete", async (req,res) =>{
    let alert= [];
    console.log(req.body.idDelete);
    if(req.body.dataType == 'User'){
        await User.findById(req.body.idDelete)
            .then( async result =>{
                if(!result){
                    alert.push({msg:"Username Not Found"})
                    res.render("admin",{user:req.user._id, alert})
                }else{
                    await Tree.find({user:result._id})
                        .then( trees =>{
                            trees.forEach(async tree =>{
                                console.log("inside here");
                                await Sap.deleteMany({tree: tree._id});
                            })
                        })
                    await Tree.deleteMany({user:result._id})
                    await Syrup.deleteMany({user:result._id})
                    await Post.deleteMany({user: result._id})
                    await Thread.deleteMany({originalPoster: result._id})
                    await User.deleteOne({_id: result._id})
                    console.log("deleted Everything");
                }
            })
    }else if(req.body.dataType == 'Tree'){
        await Tree.findById(req.body.idDelete)
            .then( async result =>{
                if(!result){
                    alert.push({msg:"Tree Not Found"})
                    res.render("admin",{user:req.user._id, alert})
                }else{
                    await Sap.deleteMany({tree: result._id});
                    await Tree.deleteOne({_id: result._id})
                }
            })
    }else if(req.body.dataType == 'Sap'){
        if(mongoose.Types.ObjectId.isValid(req.body.idDelete)){
            await Sap.findById(req.body.idDelete)
                .then(async result =>{
                    if(!result){
                        alert.push({msg:"Sap Entry Not Found"})
                        res.render("admin",{user:req.user._id, alert})
                    }else{
                        await Sap.deleteOne({_id:req.body.idDelete});
                    }
                })
        }else{
            alert.push({msg:"Sap ID is not Valid"})
            res.render("admin",{user:req.user._id, alert})
        }
    }else if(req.body.dataType == 'Syrup'){
        if(mongoose.Types.ObjectId.isValid(req.body.idDelete)){
            await Syrup.findById(req.body.idDelete)
                .then(async result =>{
                    if(!result){
                        alert.push({msg:"Syrup Entry Not Found"})
                        res.render("admin",{user:req.user._id, alert})
                    }else{
                        await Syrup.deleteOne({_id:req.body.idDelete});
                    }
                })
        }else{
            alert.push({msg:"Syrup ID is not Valid"})
            res.render("admin",{user:req.user._id, alert})
        }

    }
    console.log("reached end of func");
    res.render("admin",{user:req.user._id, alert});
});

router.post('/admin/addCategory',isAdmin, (req,res) => {
    Category.find({name:req.body.name, group:req.body.group})
        .then(result =>{
            if(result.length == 0){
                console.log(req.body);
                const category = new Category(req.body);
                category.threads = 0;
                category.posts = 0;
                category.lastPost = "";
                category._id=category.name.replace(/\s+/g, "") + "_" + category.group;
                category.save()
                    .then( ()=>{
                        res.render("admin",{user:req.user._id})
                    })
            }else{
                console.log(result);
                let alert = []
                alert.push({msg:"Category already exists"});
                Group.find({})
                    .then(groups =>{
                        res.render("addCategory",{user:req.user._id, alert, groups});
                    })

            }
        })

});

router.post("/admin/addGroup",isAdmin, (req,res) => {
    const groupID = req.body.name.replace(/\s+/g, "");
    req.body._id = groupID
    Group.findById(groupID)
        .then(result =>{
            if(!result){
                const group = new Group(req.body)
                group.save()
                    .then(() =>{
                        res.render("admin",{user:req.user._id})
                    })
            }else{
                let alert = []
                alert.push({msg:"Group already exists"});
                res.render('addGroup',{user: req.user._id,alert});
            }
        })
});

router.post('/users/:id/addSignature', isAuth, async (req,res) =>{
    const id = req.params.id;
    await User.findById(id)
        .then(async result => {
            if(!result){
                res.status(404).redirect('/404') ;
            }if (req.user._id == id) {
                result.signature = req.body.text;
                result.save();
                await Post.find({user:id})
                    .then(posts =>{
                        posts.forEach(post =>{
                            post.signature = req.body.text;
                            post.save();
                        })
                    })
                res.redirect('/users/'+id);
            }else{//not that persons account
                res.send("you are not authorized to view this");
            }
        })
        .catch(err => {
            console.log(err);
        });
});

//-----------------------get routes--------------------------//

router.get('/logout',(req, res) => {
    req.logout();
    res.redirect('/');
});

router.get('/login', (req, res) => {
    let messages = req.flash("error")
    console.log("messages",messages);
    res.render('login',{messages});
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

router.get('/users/:id/addSignature', isAuth, async (req,res) =>{
    const id = req.params.id;
    await User.findById(id)
        .then(result => {
            if(!result){
                res.status(404).redirect('/404') ;
            }else{
                let sig = '';
                if(result.signature){
                    sig = result.signature;
                }
                res.render('addSignature',{userID: id, sig});
            }
        })
        .catch(err => {
            console.log(err);
        });
});

router.get('/registerTree',isAuth, (req,res) => {
    res.render('registerTree',{link:'users/' + req.user._id});
});

router.get('/admin',isAdmin, (req,res) => {
    res.render('admin',{user: req.user._id});
});

router.get('/admin/addCategory',isAdmin, (req,res) => {
    Group.find({})
        .then( groups =>{
            res.render('addCategory',{user: req.user._id, groups});
        })
});

router.get("/admin/addGroup",isAdmin, (req,res) => {
    res.render('addGroup',{user: req.user._id});
});

router.get('/admin/download', isAdmin, async (req,res) =>{
    let workbook = new excel.Workbook(); //creating workbook
    let trees = workbook.addWorksheet('Trees'); //creating worksheet
    let seasons = workbook.addWorksheet('Seasons');
    let saps = workbook.addWorksheet('Saps');
    let syrups = workbook.addWorksheet('Syrups');
    //  WorkSheet Header
    trees.columns = [
        { header: 'User', key: 'user', width: 10 },
        { header: 'Tree ID', key: '_id', width: 10 },
        { header: 'Circumf', key: 'circumf', width: 10 },
        { header: 'Tap Height', key: 'tapHeight', width: 10 },
        { header: 'Tapping Date', key: 'tappingDate', width: 10},
        { header: 'First Season Flow', key: 'firstFlowDate', width: 15},
        { header: 'Last Season Flow', key: 'lastFlowDate', width: 15},
        { header: 'Latitude', key: 'latitude', width: 10 },
        { header: 'Longitude', key: 'longitude', width: 10},
        { header: 'Start of Season Notes', key: 'startNotes', width: 30},
        { header: 'End of Season Notes', key: 'endNotes', width: 30}

    ];
    seasons.columns = [
        { header: 'User', key: 'user', width: 10 },
        { header: 'Tree ID', key: '_id', width: 10 },
        { header: 'Season', key: 'season', width: 10 },
        { header: 'Tapping Date', key: 'tappingDates', width: 10},
        { header: 'First Season Flow', key: 'firstFlowDate', width: 15},
        { header: 'Last Season Flow', key: 'lastFlowDate', width: 15},
        { header: 'Start of Season Notes', key: 'startNotes', width: 30},
        { header: 'End of Season Notes', key: 'endNotes', width: 30}

    ];
    saps.columns = [
        { header: 'SapID', key: 'SapID', width: 10 },
        { header: 'Tree', key: 'tree', width: 10 },
        { header: 'Volume', key: 'sapVolume', width: 10 },
        { header: 'Harvest Date', key: 'harvestDate', width: 10},
        { header: 'Harvest Temp', key: 'harvestTemp', width: 10},
    ];
    syrups.columns = [
        { header: 'Syrup ID', key: 'syrupID', width: 10 },
        { header: 'User', key: 'user', width: 10 },
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
            result.forEach(tree => {
                let season = tree.season[tree.season.length -1];
                let tappingDate = tree.tappingDates[tree.tappingDates.length -1];
                let firstFlowDate = tree.firstFlowDate[tree.firstFlowDate.length -1];
                let lastFlowDate = tree.lastFlowDate[tree.lastFlowDate.length -1];
                let startNote = tree.startNotes[tree.startNotes.length -1];
                let endNote = tree.endNotes[tree.endNotes.length -1];
                if(tree.season[tree.season.length -1] == undefined){
                    season = "N/A"
                }
                if(tree.tappingDates[tree.tappingDates.length -1] == undefined){
                    tappingDate = "N/A";
                }
                if(tree.firstFlowDate[tree.firstFlowDate.length -1] == undefined){
                    firstFlowDate = "N/A"
                }
                if(tree.lastFlowDate[tree.lastFlowDate.length -1] == undefined){
                    lastFlowDate = "N/A"
                }
                if(tree.startNotes[tree.startNotes.length -1] == undefined){
                    startNote = "N/A"
                }
                if(tree.endNotes[tree.endNotes.length -1] == undefined){
                    endNote = "N/A"
                }
                trees.addRows( [{
                    user: tree.user,
                    _id: tree._id,
                    season: season,
                    circumf: tree.circumf,
                    tappingDate: tappingDate,
                    firstFlowDate: firstFlowDate,
                    lastFlowDate: lastFlowDate,
                    tapHeight:tree.tapHeight,
                    latitude: tree.latitude,
                    longitude:tree.longitude,
                    startNotes: startNote,
                    endNotes: endNote
                }]);
            });
        });
    await Tree.find({})
        .then(result =>{
            result.forEach( tree => {
                for(let i = 0; i < tree.season.length; i++){
                    let firstFlowDate = tree.firstFlowDate[i];
                    let lastFlowDate = tree.lastFlowDate[i];
                    let endNote = tree.endNotes[i];
                    let startNote = tree.startNotes[i];
                    if(tree.startNotes[i] == undefined){
                        startNote = "N/A"
                    }
                    if(tree.endNotes[i] == undefined){
                        endNote = "N/A"
                    }
                    if(tree.firstFlowDate[i] == undefined){
                        firstFlowDate = "N/A"
                    }
                    if(tree.lastFlowDate[i] == undefined){
                        lastFlowDate = "N/A"
                    }
                    seasons.addRows( [{
                        user:tree.user,
                        _id: tree._id,
                        season: tree.season[i],
                        tappingDates: tree.tappingDates[i],
                        firstFlowDate: firstFlowDate,
                        lastFlowDate: lastFlowDate,
                        startNotes: startNote,
                        endNotes: endNote
                    }]
                   )
                }
            })
        });
    await Sap.find({})
        .then(result =>{
            result.forEach(sap => {
                saps.addRow( {
                    SapID: sap._id.toString(),
                    tree: sap.tree,
                    sapVolume:sap.sapVolume,
                    harvestDate: sap.harvestDate,
                    harvestTemp: sap.harvestTemp,
                });
            });
        });
    await Syrup.find({})
        .then(results =>{
            results.forEach(result =>{
                syrups.addRow({
                    syrupID: result._id.toString(),
                    user: result.user,
                    syrupProduced: result.syrupProduced + " " + result.units,
                    sapProcessed: result.sapProcessed  + " " + result.units,
                    sapLost: result.sapLost + " " + result.units,
                    processingDate: result.processingDate,
                    hours: result.hours,
                    minutes: result.minutes,
                    fuelType: result.fuelType
                });
            });
        });
    workbook.xlsx.writeFile("./Data/Data.xlsx")
        .then(function() {
            res.download("./Data/Data.xlsx");
        });

});


router.get('/trees/:id/registerHarvest',isAuth, async (req,res) => {
    const id = req.params.id;
    await Tree.findById(id)
        .then(result => {
            res.render('registerHarvest', {
                link: "/trees/"+id,
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
                link: '/trees/' + id,
                treeID: req.params.id,
                });
        })
        .catch(err =>{console.log(err)});
});

router.get('/trees/:id/startTreeSeason', isAuth, async (req,res) => {
    const id = req.params.id;
    await Tree.findById(id)
        .then(result => {
            res.render('startTreeSeason', {
                link: '/trees/' + id,
                treeID: req.params.id,
            });
        })
        .catch(err =>{console.log(err)});
});

router.get('/registerSyrup', isAuth,(req,res) => {
    res.render('registerSyrup',{
            profileLink: '/users/' + req.user._id
    });
});

router.get('/users/:id/syrup', isAuth, async (req,res) => {
    const id = req.params.id;
    await Syrup.find({user: id})
        .then(result => {
            res.render('syrup', {
                link: '/users/' + id,
                user: id,
                syrupData: result
            });
        })
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
                        res.render('tree',{link:'/users/' + req.user._id,
                            entryLink: entryLink,
                            treeID: req.params.id,
                            saps: sapList,
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
