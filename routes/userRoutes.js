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
const async = require('async');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const {google} = require('googleapis');

require('dotenv').config();

// Password reset
const CLIENT_ID = '967810289324-2naaq6ubumf71n5gcfeqbvd80ekqvack.apps.googleusercontent.com';
const CLIENT_SECRET = 'OKvY4Lyk6Y-pnNMtIffYshK8';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//04ZAprT5OjSQfCgYIARAAGAQSNgF-L9IrzJI4yGXIH-_3aJploJr99Ap_EnjVY3zUF6p4NZpzi6P8tpZ1kmmjZ2cLGPUQ_AJjIw';
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({refresh_token: REFRESH_TOKEN});

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
        let tapDate = req.body.tappingDate;
        req.body.tappingDate = null;
        let startNotes = req.body.startNotes
        req.body.startNotes = [];
        const tree = new Tree(req.body);
        tree.Tapped = true;
        tree.firstFlowDate = [];
        tree.lastFlowDate = [];
        tree.tappingDates.push(tapDate);
        console.log('pushed date',tree);
        tree.startNotes.push(startNotes);
        let year = tapDate.toString().substr(0,4)
        console.log(tapDate.toString().substr(0,4));
        tree.season.push(year);
        console.log("updated Tree",tree);
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
    const treeID = req.body.tree;
    await Tree.findById(treeID)
        .then(async result =>{
            const currentSeason = result.season[result.season.length -1];
            await Sap.find({tree:treeID,season:currentSeason})
                .then(sapResult =>{
                    console.log("sapResult:",sapResult);
                    if(sapResult.length > 0){//not first sap entry for the season
                        console.log("inside not first sap entry");
                        let sap = new Sap(req.body);
                        sap.season = currentSeason;
                        sap.save()
                            .then(() => {
                                res.redirect("/trees/" + sap.tree);
                            })
                            .catch((err) => console.log(err));
                    }else{//first sap entry for the season
                        console.log("inside first sap entry");
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
    await Tree.findById(id)
        .then( async result =>{
            await Sap.find({tree:id,season:result.season[result.season.length - 1]}).sort({harvestDate:-1}).limit(1)
                .then(sap =>{
                    console.log(sap);
                    if(sap.length > 0){// has sap entries
                        console.log("has sap entries");
                        result.lastFlowDate.push(sap[0].harvestDate);
                        result.Tapped = false;
                        result.endNotes.push(req.body.endNotes);
                        console.log("after tapped")
                        result.save()
                        console.log("after saved")
                        res.redirect("/trees/" + id);
                    }else{
                        console.log("does not have sap entries");
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
    res.redirect('http://localhost:3000/trees/' + id);
});

router.post('/trees/:id/startTreeSeason',isAuth, async (req, res) => {
    const id = req.body._id;
    console.log(id);
    await Tree.findById(id)
        .then( async result =>{
            result.tappingDates.push(req.body.tappingDate);
            result.startNotes.push(req.body.startNotes);
            let year = req.body.tappingDate.toString().substring(0,4)
            result.season.push(year);
            result.Tapped = true;
            result.save()
                .then( () =>{
                   res.redirect('http://localhost:3000/trees/' + id);
                });
        })
        .catch(err => {
            console.log(err);
        })
    res.redirect('http://localhost:3000/trees/' + id);
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
    console.log(req.body);
    let alert=[];
    const username = req.body.username;
    User.findById(username)
        .then(result =>{
            console.log(result);
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

router.post('/forgotPass', async (req,res,next) => {
    let accessToken = await oAuth2Client.getAccessToken();
    console.log(accessToken.token);
    // waterfall = array of functions called in sequence
        // function(done) {
        //     crypto.randomBytes(20, function(err, buf) {
        //         var token = buf.toString('hex');
        //         done(err, token);
        //     });
        // },
    User.findOne({email: req.body.email})
        .then(result => {
            if (!result) {
                req.flash('error', 'No account with that email address exists.');
                return res.redirect('/forgotPass');
            }else{
                result.resetPasswordToken = accessToken.token;
                result.resetPasswordExpires = Date.now() + 3600000; // 1 hour in ms
                console.log("updated",result);
                result.save()
                    .then(()=>{
                        let smtpTransport = nodemailer.createTransport({
                            // This service can be changed if buggy. Bugs w/ Gmail+nodemailer have been reported
                            // This is also the part I'm having trouble with (auth)
                            // Error: Missing credentials for "PLAIN"
                            service: 'Gmail',
                            auth: {
                                type: 'OAuth2',
                                user: 'gogetmeseashells@gmail.com',
                                clientId: CLIENT_ID,
                                clientSecret: CLIENT_SECRET,
                                refreshToken: REFRESH_TOKEN,
                                accessToken: accessToken.token
                            }
                            // auth: {
                            //     user: 'gogetmeseashells@gmail.com',
                            //     pass: process.env.GMAILPW
                            // }
                        });
                        let mailOptions = {
                            to: result.email,
                            from: 'gogetmeseashells@gmail.com',
                            subject: 'Stockton Maple Password Reset',
                            text: 'You are receiving this email because you have requested the reset of your Stockton Maple password. ' +
                                'Please click the following link to complete this process:\n' +
                                'http://' + req.headers.host + '/resetPass/' + accessToken.token
                        }
                        smtpTransport.sendMail(mailOptions, (err) => {
                            console.log('mail sent');
                            req.flash('success', 'An email has been sent to ' + result.email);
                        });
                        res.redirect("/");
                    });
            }
        });
    });

router.post('/resetPass/:accessToken', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.accessToken, resetPasswordExpires: { $gt: Date.now() } })
        .then(async result =>{
            console.log("results",result);
            if (!result) {
                req.flash('error', 'Password reset token is invalid or has expired.');
                return res.redirect('/login');
            }else {
                if (req.body.password === req.body.confirm) {
                    const hashedPassword = await bcrypt.hash(req.body.password, 10);
                    result.password = hashedPassword;
                    result.save().then(() => {
                        let smtpTransport = nodemailer.createTransport({
                            service: 'Gmail',
                            auth: {
                                user: 'gogetmeseashells@gmail.com',
                                pass: process.env.GMAILPW
                            }
                        });
                        let mailOptions = {
                            to: result.email,
                            from: 'gogetmeseashells@gmail.com',
                            subject: 'Your password has been changed',
                            text: 'Hello,\n\n' +
                                'This is a confirmation that the password for your account ' + result.email + ' has just been changed.\n'
                        };
                        smtpTransport.sendMail(mailOptions, () => {
                            req.flash('success', 'Success! Your password has been changed.');
                        });
                        res.redirect('/login');
                    });
                }
            }
        });


    // async.waterfall([
    //   function(done) {
    //     User.findOne({ resetPasswordToken: req.params.accessToken, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    //       if (!user) {
    //         req.flash('error', 'Password reset token is invalid or has expired.');
    //         return res.redirect('/login');
    //       }
    //       if(req.body.password === req.body.confirm) {
    //         const hashedPassword = bcrypt.hash(req.body.password, 10);
    //         User.password = hashedPassword;
    //         User.save().then(() => {
    //             res.redirect('/login');
    //         })
    //       } else {
    //           req.flash("error", "Passwords do not match.");
    //           return res.redirect('/login');
    //       }
    //     });
    //   },
    //   function(user, done) {
    //     var smtpTransport = nodemailer.createTransport({
    //       service: 'Gmail',
    //       auth: {
    //         user: 'gogetmeseashells@gmail.com',
    //         pass: process.env.GMAILPW
    //       }
    //     });
    //     var mailOptions = {
    //       to: user.email,
    //       from: 'gogetmeseashells@gmail.com',
    //       subject: 'Your password has been changed',
    //       text: 'Hello,\n\n' +
    //         'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
    //     };
    //     smtpTransport.sendMail(mailOptions, function(err) {
    //       req.flash('success', 'Success! Your password has been changed.');
    //       done(err);
    //     });
    //   }
    // ], function(err) {
    //   res.redirect('/login');
    // });
  });

//-----------------------get routes--------------------------//
router.get('/forgotPass', (req,res) => {
    res.render('forgotPass');
});

router.get('/resetPass/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('/forgotPass');
      }
      res.render('resetPass', {token: req.params.token});
    });
  });

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
    res.render('admin',{user: req.user._id});
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
                console.log(sap);
                saps.addRow( {
                    SapID: sap._id,
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
                    syrupID: result._id,
                    user: result.user,
                    syrupProduced: result.syrupProduced,
                    sapProcessed: result.sapProcessed,
                    sapLost: result.sapLost,
                    processingDate: result.processingDate,
                    hours: result.hours,
                    minutes: result.minutes,
                    fuelType: result.fuelType
                });
            });
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

router.get('/trees/:id/startTreeSeason', isAuth, async (req,res) => {
    const id = req.params.id;
    await Tree.findById(id)
        .then(result => {
            res.render('startTreeSeason', {
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

router.get('/forumHome', (req, res) => {
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
