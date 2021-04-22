const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postSchema = new Schema({
    user:{
      type:String //user id
    },
    text: {
        type: String,
    },
    thread: {
        type: String, //thread ID
    },
    signature: {
        type: String
    },
},{timestamps: true});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;