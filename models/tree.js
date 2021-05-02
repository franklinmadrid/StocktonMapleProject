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
    circumf: {
        type: Number,
        required: true
    },
    tappingDates: [{
        type: Date,
    }],
    firstFlowDate: [{
        type: Date,
    }],
    lastFlowDate: [{
        type: Date,
    }],
    tapHeight: {
        type: Number,
        required: true
    },
    latitude: {
        type: Number,
    },
    longitude: {
        type: Number,
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
    Tapped:{
        type: Boolean
    }
    },{timestamps: true});

const Tree = mongoose.model('Tree', treeSchema);
module.exports = Tree;