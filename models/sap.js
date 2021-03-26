const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sapSchema = new Schema({
    tree: {
        type: String,
        required: true
    },
    harvestDate: {
        type: Date,
        required: true
    },
    sapVolume: {
        type: Number,
        required: true
    },
    harvestTemp: {
        type: Number,
        required: true
    },
},{timestamps: true});

const Sap = mongoose.model('Sap', sapSchema);
module.exports = Sap;