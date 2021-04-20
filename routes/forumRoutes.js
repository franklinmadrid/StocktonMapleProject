const express = require('express');
const router = express.Router();
const Group = require("../models/group");
const Category = require("../models/category");
const Thread = require("../models/thread");
const Post = require("../models/post");
const {isAuth} = require("./authMiddleware");

router.get("/forumHome",async (req, res) => {
    await Group.find({})
        .then(async groups =>{
            await Category.find({})
                .then(async categories =>{
                    let profileLink = "/login";
                    if(req.user != null){
                        profileLink = "/users/"+ req.user._id;
                    }
                    res.render("forumHome",{
                        link:"/",
                        profileLink,
                        categories,
                        groups
                    });
                })
        })

});

router.get("/forumHome/:group/:category", async (req , res) =>{
    const groupID = req.params.group;
    const catID = req.params.category + "_" + groupID;
    await Category.findById(catID)
        .then(async result =>{
            if(!result){
                res.redirect("/404")
            }else{
                await Thread.find({category:result._id})
                    .then(result =>{
                        console.log(result);
                        let profileLink = "/login";
                        if(req.user != null){
                            profileLink = "/users/"+ req.user._id;
                        }
                        res.render('category', {
                            link:"/",
                            profileLink,
                            categoryName: req.params.category,
                            groupID,
                        });
                    });
            }
        })
});

router.get("/forumHome/:group/:category/addThread", (req,res) =>{
    const groupID = req.params.group;
    const catName = req.params.category;
    res.render("addThread",{
        groupID,
        catName
    });
});

//-----------------Post Routes----------------//
router.post("/forumHome/:group/:category/addThread",isAuth,(req, res) =>{
    const groupID = req.params.group;
    const catID = req.params.category + "_" + groupID;
    console.log(catID);
    let thread =  new Thread()
    thread.name = req.body.name;
    thread.originalPoster = req.user._id;
    thread.category = catID;
    thread.save();
    if(req.body.text.length != 0){
        let post = new Post()
        post.text = req.body.text
        post.thread = thread._id;
        post.user = req.user._id;
        post.save();
    }
    res.redirect('/forumHome/' + groupID + "/" + req.params.category);
});

module.exports = router;