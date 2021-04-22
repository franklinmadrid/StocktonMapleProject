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


