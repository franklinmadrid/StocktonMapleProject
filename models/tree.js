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
    lastFlowDate: {
        type: Date, // ?
        required: false
    },
    tapHeight: {
        type: Number,
        required: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    season: {
        type: Number,
        required: true
    },
    startNotes:{
        type: String,
        required: false
    },
    endNotes:{
        type: String,
        required: false
    },
    // firstflowDate: {
    //     type: Date,
    //     required: true
    // },
    },{timestamps: true});

const Tree = mongoose.model('Tree', treeSchema);
module.exports = Tree;