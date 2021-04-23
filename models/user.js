const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        //unique = true
    },
    _id: {
        type: String,
        required: true,
        //unique = true
    },
    password: {
        type: String,
        required: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    moderator:{
      type: Boolean,
      required: false
    },
    signature:{
        type:String
    },
    admin: {
        type: Boolean,
        required: false
    },
    banned:{
        type:Boolean
    }
    },{timestamps: true});

const User = mongoose.model('User', userSchema);
module.exports = User;


