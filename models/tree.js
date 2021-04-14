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
    tappingDates: [{
        type: Date, // ?
    }],
    lastFlowDate: {
        type: Date, // ?
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
    season: [{
        type: Number,
    }],
    startNotes: [{
        type: String,
    }],
    endNotes: [{
        type: String,
    }],
    firstFlowDate: {
        type: Date,
    },
    Tapped:{
        type: Boolean
    }
    },{timestamps: true});

const Tree = mongoose.model('Tree', treeSchema);
module.exports = Tree;