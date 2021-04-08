const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    _id: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    },
    moderator:{
      type: Boolean,
      required: false
    },
    modCategories:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    admin: {
        type: Boolean,
        required: false
    }
    },{timestamps: true});

const User = mongoose.model('User', userSchema);
module.exports = User;


