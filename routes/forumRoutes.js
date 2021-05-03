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
                        result.sort((a,b) => (a.lastPostDate > b.lastPostDate) ? -1 : ((b.lastPostDate > a.lastPostDate) ? 1 : 0));
                        if(req.user){
                            if(req.user.admin || req.user.moderator){
                                res.render('categoryMod', {
                                    link:"/",
                                    profileLink,
                                    categoryName: req.params.category,
                                    groupID,
                                    categoryDisplayName:catResult.name,
                                    threads: result
                                });
                            }else{
                                res.render('category', {
                                    link:"/",
                                    profileLink,
                                    categoryName: req.params.category,
                                    groupID,
                                    categoryDisplayName:catResult.name,
                                    threads: result
                                });
                            }
                        }else{
                            res.render('category', {
                                link:"/",
                                profileLink,
                                categoryName: req.params.category,
                                groupID,
                                categoryDisplayName:catResult.name,
                                threads: result
                            });
                        }

                    });
            }
        })
});

router.get("/forumHome/:group/:category/addThread",isAuth, (req,res) =>{
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
                .then(async result =>{
                    const threadName = thread.name;
                    result = JSON.stringify(result)
                    thread.views++;
                    await thread.save()
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
router.post("/forumHome/:group/:category/addThread",isAuth, async (req, res) =>{
    const groupID = req.params.group;
    if(!req.user.banned){//not banned user
        const catID = req.params.category + "_" + groupID;
        console.log(catID);
        let thread =  new Thread()
        thread.name = req.body.name;
        thread.originalPoster = req.user._id;
        thread.category = catID;
        thread.posts = 0;
        thread.views = 0;
        thread.lastPostUser = req.user._id;
        console.log("req.body:",req.body);
        if(req.body.text.length != 0){
            let post = new Post();
            post.text = req.body.text;
            post.thread = thread._id;
            post.user = req.user._id;
            thread.posts++;
            thread.lastPostUser = post.user;
            await User.findById(req.user._id)
                .then(async result =>{
                    post.signature = result.signature
                    await post.save();
                    thread.lastPostDate = post.createdAt;
                })
        }
        await thread.save()
        if (!thread.lastPostDate){
            thread.lastPostDate = thread.createdAt;
            await thread.save();
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
                    .then( async () =>{
                        await Thread.findById(threadID)
                            .then(async result =>{
                                if(result){
                                    result.lastPostUser = post.user;
                                    result.lastPostDate = post.createdAt;
                                    result.posts++;
                                    await result.save()
                                }
                            })
                        res.redirect(link);
                    })
            })
    }else{//banned user
        res.redirect(link);
    }

});

router.post("/deletePost/:postID", isAuth, async (req,res) =>{
    if(req.user.admin || req.user.moderator){
        const postID = req.params.postID;
        const url = req.body.url;
        console.log("url",url);
        await Post.findById(postID)
            .then(async post =>{
                Thread.findById(post.thread)
                    .then(async result =>{
                        result.posts--;
                        if(result.lastPostUser == post.user){
                            Post.find({thread:result._id})
                                .then(async (posts) =>{
                                    console.log( posts[posts.length - 1]);
                                    if(posts.length > 1){
                                        result.lastPostUser = posts[posts.length - 2].user;
                                        result.lastPostDate = posts[posts.length - 2].createdAt;
                                    }else{
                                        result.lastPostUser = result.originalPoster;
                                        result.lastPostDate = result.createdAt;
                                    }
                                    await result.save()
                                    await Post.deleteOne({_id:postID}, (err) =>{
                                        if(err){
                                            console.log(error);
                                        }
                                        res.redirect(url);
                                    });
                                });
                        }else{
                            await result.save()
                            await Post.deleteOne({_id:postID}, (err) => {
                                if (err) {
                                    console.log(error);
                                }
                                res.redirect(url);
                            });
                        }
                    })
            })
    }else{
        res.status(401).send("Not Authorized to view this");
    }
})

router.post('/deleteThread/:threadID', isAuth, async (req,res) =>{
    if(req.user.admin || req.user.moderator){
        const threadID = req.params.threadID;
        await Post.deleteMany({thread:threadID});
        Thread.deleteOne({_id:threadID})
            .then(()=>{
                res.redirect(req.body.url);
            })
    }else{
        res.status(401).send("Not authorized to view this");
    }
})

router.post("/banUser/:userID",isAuth,async (req,res) =>{
    if(req.user.admin || req.user.moderator){
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
                                thread.originalPoster = "**BANNED**";
                                thread.save();
                            })
                        })
                    await Thread.find({lastPostUser:result._id})
                        .then(threads =>{
                            threads.forEach(thread =>{
                                thread.lastPostUser = "**BANNED**";
                                thread.save();
                            })
                        })
                }
                res.redirect(url);
            })
    }else{
        res.status(401).send("Not Authorized to view this");
    }

})

module.exports = router;