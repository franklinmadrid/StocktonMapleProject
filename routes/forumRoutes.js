const express = require('express');
const router = express.Router();
const Group = require("../models/group");
const Category = require("../models/category");
const Thread = require("../models/thread");
const Post = require("../models/post");
const User = require("../models/user");
const {isMod} = require("./authMiddleware");
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
        .then(async catResult =>{
            if(!catResult){
                res.redirect("/404")
            }else{
                await Thread.find({category:catResult._id})
                    .then(result =>{
                        let profileLink = "/login";
                        if(req.user != null){
                            profileLink = "/users/"+ req.user._id;
                        }
                        res.render('category', {
                            link:"/",
                            profileLink,
                            categoryName: req.params.category,
                            groupID,
                            categoryDisplayName:catResult.name,
                            threads: result
                        });
                    });
            }
        })
});

router.get("/forumHome/:group/:category/addThread", (req,res) =>{
    const groupID = req.params.group;
    const catName = req.params.category;
    if(req.user.banned){
        res.redirect("/forumHome/" + groupID + "/" + catName);
    }else{
        res.render("addThread",{
            groupID,
            catName
        });
    }
});

router.get("/forumHome/:group/:category/:threadID", async (req,res) =>{
    const groupID = req.params.group;
    const catName = req.params.category;
    const threadID = req.params.threadID;
    await Thread.findById(threadID)
        .then(async thread =>{
            await Post.find({thread:threadID})
                .then(result =>{
                    const threadName = thread.name;
                    result = JSON.stringify(result)
                    if(req.user){//logged in
                        if(req.user.admin == true || req.user.moderator == true){
                            res.render("threadMod",{
                                result,
                                groupID,
                                threadID,
                                catName,
                                threadName,
                                originalPoster: thread.originalPoster
                            });
                        }else{//logged in not a mod or admin
                            res.render("thread",{
                                result,
                                groupID,
                                threadID,
                                catName,
                                threadName,
                                originalPoster: thread.originalPoster
                            });
                        }
                    }else{
                        res.render("thread",{
                            result,
                            groupID,
                            threadID,
                            catName,
                            threadName,
                            originalPoster: thread.originalPoster
                        });
                    }
                });
        })

});

router.get("/forumHome/:group/:category/:threadID/reply", isAuth,(req,res) =>{
    const threadID = req.params.threadID;
    const groupID = req.params.group;
    const category = req.params.category
    if(req.user.banned){
        res.redirect("/forumHome/" + groupID + "/" + category + "/" + threadID);
    }else{
        res.render("addPost",{
            user: req.user._id,
            groupID,
            category,
            threadID
        });
    }

});

//-----------------Post Routes----------------//
router.post("/forumHome/:group/:category/addThread",isAuth,(req, res) =>{
    const groupID = req.params.group;
    if(!req.user.banned){//not banned user
        const catID = req.params.category + "_" + groupID;
        console.log(catID);
        let thread =  new Thread()
        thread.name = req.body.name;
        thread.originalPoster = req.user._id;
        thread.category = catID;
        thread.save();
        console.log("req.body:",req.body);
        if(req.body.text.length != 0){
            let post = new Post()
            post.text = req.body.text
            post.thread = thread._id;
            post.user = req.user._id;
            User.findById(req.user._id)
                .then(result =>{
                    post.signature = result.signature
                    post.save();
                })
        }
        res.redirect('/forumHome/' + groupID + "/" + req.params.category);
    }else{//banned user
        res.redirect('/forumHome/' + groupID + "/" + req.params.category);
    }

});

router.post("/forumHome/:group/:category/:threadID/reply", isAuth,(req,res) =>{
    const threadID = req.params.threadID;
    const groupID = req.params.group;
    const category = req.params.category
    const link = "/forumHome/"+ groupID + "/" + category + "/" + threadID;
    if(!req.user.banned){
        User.findById(req.user._id)
            .then(result =>{
                let post = new Post({
                    user:req.user._id,
                    text:req.body.text,
                    thread: threadID,
                    signature: result.signature
                })
                post.save()
                    .then( () =>{
                        res.redirect(link);
                    })
            })
    }else{//banned user
        res.redirect(link);
    }

});

router.post("/deletePost/:postID",isMod,async (req,res) =>{
    const postID = req.params.postID;
    const url = req.body.url;
    console.log("url",url);
    await Post.deleteOne({_id:postID}, (err) =>{
        if(err){
            console.log(error);
        }
        res.redirect(url);
    });
})

router.post("/banUser/:userID",isMod,async (req,res) =>{
    const userID = req.params.userID;
    const url = req.body.url;
    console.log("url",url);
    await User.findById(userID)
        .then(async (result)=>{
            if(result){
                result.banned = true;
                result.save();
                await Post.find({user:result._id})
                    .then(posts =>{
                        posts.forEach(post =>{
                            post.user = "**BANNED**"
                            post.save();
                        })
                    })
                await Thread.find({originalPoster:result._id})
                    .then(threads =>{
                        threads.forEach(thread =>{
                            thread.originalPoster = "**BANNED**"
                            thread.save();
                        })
                    })
            }
            res.redirect(url);
        })
})

module.exports = router;