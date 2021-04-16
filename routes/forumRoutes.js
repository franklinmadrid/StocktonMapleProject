const express = require('express');
const router = express.Router();
const Group = require("../models/group");
const Category = require("../models/category");

router.get("/forumHome",async (req, res) => {
    await Group.find({})
        .then(async groups =>{
            await Category.find({})
                .then(async categories =>{
                    res.render("forumHome",{
                        link:"/",
                        profileLink:"/users/"+ req.user._id,
                        categories,
                        groups
                    });
                })
        })

});

module.exports = router;