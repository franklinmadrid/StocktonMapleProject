const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const treeSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    user:{
        type: String,
        required: true
    },
    stemCount: {
        type: Number,
        required: true
    },
    circumf: {
        type: Number,
        required: true
    },
    tappingDate: {
        type: Date, // ?
        required: true
    },
    tapHeight: {
        type: Number,
        required: true
    },
    // firstflowDate: {
    //     type: Date,
    //     required: true
    // },
    // lastflowDate: {
    //     type: Date,
    //     required: true
    // }
    },{timestamps: true});

const Tree = mongoose.model('Tree', treeSchema);
module.exports = Tree;