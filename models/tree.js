const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const treeSchema = new Schema({
    treeID: {
        type: String,
        required: true
    },
    stemCount: {
        type: Integer,
        required: true
    },
    circumf: {
        type: Float,
        required: true
    },
    tappingDate: {
        type: Date, // ?
        required: true
    },
    tapHeight: {
        type: Float,
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