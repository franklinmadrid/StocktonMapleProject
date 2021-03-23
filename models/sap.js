const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sapSchema = new Schema({
    harvestDate: {
        type: Date,
        required: true
    },
    sapVolume: {
        type: Number,
        required: true
    },
    
    },{timestamps: true});

const Sap = mongoose.model('Sap', sapSchema);
module.exports = Sap;