const mongoose = require("mongoose");
const express = require('express');
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const async = require('async');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const {google} = require('googleapis');
const flash = require('connect-flash');

require('dotenv').config();

// Password reset credentials (Google Mail API)
const CLIENT_ID = '967810289324-2naaq6ubumf71n5gcfeqbvd80ekqvack.apps.googleusercontent.com';
const CLIENT_SECRET = 'OKvY4Lyk6Y-pnNMtIffYshK8';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//04ZAprT5OjSQfCgYIARAAGAQSNgF-L9IrzJI4yGXIH-_3aJploJr99Ap_EnjVY3zUF6p4NZpzi6P8tpZ1kmmjZ2cLGPUQ_AJjIw';
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({refresh_token: REFRESH_TOKEN});


//----------------------post routes--------------------------//
router.post('/forgotPass', async (req,res,next) => {
    let accessToken = await oAuth2Client.getAccessToken();
    let alert = [];
    User.findOne({email: req.body.email})
        .then(result => {
            if (!result) {
                alert.push({msg: "No account with that email address exists"});
                res.render('forgotPass', {alert});
            }else{
                result.resetPasswordToken = accessToken.token;
                result.resetPasswordExpires = Date.now() + 3600000; // 1 hour in ms
                result.save()
                    .then(()=>{
                        let smtpTransport = nodemailer.createTransport({
                            service: 'Gmail',
                            auth: {
                                type: 'OAuth2',
                                user: 'gogetmeseashells@gmail.com',
                                clientId: CLIENT_ID,
                                clientSecret: CLIENT_SECRET,
                                refreshToken: REFRESH_TOKEN,
                                accessToken: accessToken.token
                            }
                        });
                        let mailOptions = {
                            to: result.email,
                            from: 'gogetmeseashells@gmail.com',
                            subject: 'Stockton Maple Password Reset',
                            text: 'You are receiving this email because you have requested the reset of your Stockton Maple password. ' +
                                'Please click the following link to complete this process:\n' +
                                'http://' + req.headers.host + '/resetPass/' + accessToken.token
                        }
                        smtpTransport.sendMail(mailOptions, (err) => {
                            console.log('mail sent');
                        });
                        alert.push({msg: 'A password reset email has been sent to ' + result.email});
                        res.render('forgotPass', {alert});
                    });
            }
        });
    });

router.post('/resetPass/:accessToken', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.accessToken, resetPasswordExpires: { $gt: Date.now() } })
        .then(async result =>{
            if (!result) {
                req.flash('error', 'Password reset token is invalid or has expired.');
                return res.redirect('/login');
            }else {
                if (req.body.password === req.body.confirm) {
                    const hashedPassword = await bcrypt.hash(req.body.password, 10);
                    result.password = hashedPassword;
                    result.save().then(() => {
                        let smtpTransport = nodemailer.createTransport({
                            service: 'Gmail',
                            auth: {
                                user: 'gogetmeseashells@gmail.com',
                                pass: process.env.GMAILPW
                            }
                        });
                        let mailOptions = {
                            to: result.email,
                            from: 'gogetmeseashells@gmail.com',
                            subject: 'Your password has been changed',
                            text: 'Hello,\n\n' +
                                'This is a confirmation that the password for your account ' + result.email + ' has just been changed.\n'
                        };
                        smtpTransport.sendMail(mailOptions, () => {
                            req.flash('success', 'Success! Your password has been changed.');
                        });
                        res.redirect('/login');
                    });
                }
            }
        });
  });

//-----------------------get routes--------------------------//
router.get('/forgotPass', (req,res) => {
    const errors = req.flash().error || [];
    res.render('forgotPass', {errors});
});

router.get('/resetPass/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('/forgotPass');
      }
      res.render('resetPass', {token: req.params.token});
    });
  });

  module.exports = router;