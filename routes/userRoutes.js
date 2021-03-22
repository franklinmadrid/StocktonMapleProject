const express = require('express');
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Tree = require("../models/tree");
const router = express.Router();

router.post('/users',async (req,res) =>{
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        req.body.password = hashedPassword;
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

router.post('/users/login', async (req,res) =>{
    console.log(req.body);
    User.find({username : req.body.username}, async (err, data) =>{
        if(err){
            console.log(err)
        }else if(data.length == 0){
            console.log('User Doesnt exist')
            return res.status(400).send("User doesn't exist")
        }else{
            try{
                if(await bcrypt.compare(req.body.password,data[0].password)){
                    res.redirect("/users/" + data[0]._id);
                }else{
                    res.send('wrong password');
                }
            } catch{
                res.status(500).send();
            }
        }


    });
});
router.get('/users/registerTree', (req,res) => {
    res.render('registerTree');
});

router.post('/users/trees',async (req, res) => {
    try{
        const tree = new Tree(req.body);
        tree.save()
            .then((result) => {
                res.redirect("/users");
            })
            .catch((err) => console.log(err));
    } catch{
        res.status(500);
    }
});

router.get('/users/:id', async (req,res) =>{
    const id = req.params.id;
    await User.findById(id)
        .then(result => {
            if(result == null){
                res.status(404).send('404 error') ;
            }
            res.render('user',{user: result, title: result.username + "'s profile"})
        })
        .catch(err => {
            console.log(err);
        });
});

module.exports= router;
