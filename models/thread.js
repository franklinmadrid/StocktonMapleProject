const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const threadSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    originalPoster:{
        type: String, //user ID
        required: true,
    },
    category: {
        type: String, //category ID
        required: true
    },
    posts:{
        type:Number
    },
    lastPost:{
        type:String //lastPost ID
    }
},{timestamps: true});

const Thread = mongoose.model('Thread', threadSchema);
module.exports = Thread;