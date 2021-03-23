const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const syrupSchema = new Schema({
    sapProcessed: {
        type: Number,
        required: true
    },
    sapLost: {
        type: Number,
        required: true
    },
    processingDate: {
        type: Date,
        required: true
    },
    // might be incorrect?
    timeToProcess: {
        hours: {
            type: Number,
            required: true
        },
        minutes: {
            type: Number,
            required: true
        }
    },
    syrupProduced: {
        type: Number,
        required: true
    },
    fueltType: {
        type: String,
        required: true
    },
    // left req = false not sure if necessary
    fuelAmount: {
        type: Number,
        required: false
    },
},{timestamps: true});

const Syrup = mongoose.model('Syrup', syrupSchema);
module.exports = Syrup;