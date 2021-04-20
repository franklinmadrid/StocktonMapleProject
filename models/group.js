const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupSchema = new Schema({

    _id: {
        type: String,
        required: true,
        //unique = true
    },
    name: {
        type: String,
        required: true,
        //unique = true
    },
},{timestamps: true});

const Group = mongoose.model('Group', groupSchema);
module.exports = Group;