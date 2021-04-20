const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    _id:{
        type:String
    },
    name: {
        type: String,
        required: true,
    },
    moderators: [{
        type: String, //usernames
    }],
    group: {
        type: String,
        required: true
    },
    description:{
        type:String,
        required: true
    },
    threads:{
        type:Number
    },
    posts:{
        type:Number
    },
    lastPost:{
        type:String
    }
},{timestamps: true});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;