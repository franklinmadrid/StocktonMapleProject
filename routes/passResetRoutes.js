const mongoose = require("mongoose");
const express = require('express');
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const async = require('async');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const {google} = require('googleapis');

require('dotenv').config();

// Password reset credentials (Google Mail API)
oAuth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URI)
oAuth2Client.setCredentials({refresh_token: process.env.REFRESH_TOKEN});


//----------------------post routes--------------------------//
router.post('/forgotPass', async (req,res,next) => {
    let accessToken = await oAuth2Client.getAccessToken();
    //console.log(accessToken);
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
                                user: 'StocktonMaple@gmail.com',
                                clientId: process.env.CLIENT_ID,
                                clientSecret: process.env.CLIENT_SECRET,
                                refreshToken: process.env.REFRESH_TOKEN,
                                accessToken: accessToken.token
                            }
                        });
                        let mailOptions = {
                            to: result.email,
                            from: 'StocktonMaple@gmail.com',
                            subject: 'Stockton Maple Password Reset',
                            text: 'You are receiving this email because you have requested the reset of your Stockton Maple password. ' +
                                'Please click the following link to complete this process:\n' +
                                'http://' + req.headers.host + '/resetPass/' + accessToken.token
                        }
                        smtpTransport.sendMail(mailOptions, () => {
                            console.log('mail sent');
                        });
                        alert.push({msg: 'A password reset email has been sent to ' + result.email});
                        res.render('forgotPass', {alert});
                    });
            }
        });
    });

router.post('/resetPass/:accessToken', function(req, res) {
    let alert = [];
    User.findOne({ resetPasswordToken: req.params.accessToken, resetPasswordExpires: { $gt: Date.now() } })
        .then(async result =>{
            if (!result) {
                alert.push("Password reset token is invalid or has expired.");
                return res.render('login', {messages:alert});
            }else {
                if (req.body.password === req.body.confirm) {
                    const hashedPassword = await bcrypt.hash(req.body.password, 10);
                    result.password = hashedPassword;
                    result.save().then(() => {
                        let smtpTransport = nodemailer.createTransport({
                            service: 'Gmail',
                            auth: {
                                user: 'StocktonMaple@gmail.com',
                                pass: process.env.GMAILPW
                            }
                        });
                        let mailOptions = {
                            to: result.email,
                            from: 'gogetmeseashells@gmail.com',
                            subject: 'Your Stockton Maple password has been changed',
                            text: 'Hello,\n\n' +
                                'This is a confirmation that the password for your account ' + result.email + ' has just been changed.\n'
                        };
                        smtpTransport.sendMail(mailOptions, () => {
                            console.log('mail sent');
                        });
                        alert.push("Success! Your password has been changed.");
                        res.render('login', {messages:alert});
                    });
                }
            }
        });
  });

//-----------------------get routes--------------------------//
router.get('/forgotPass', (req,res) => {
    res.render('forgotPass');
});

router.get('/resetPass/:token', function(req, res) {
    alert = [];
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        alert.push({msg: "Password reset token is invalid or has expired."});
        return res.render('forgotPass', {alert});
      }
      res.render('resetPass', {token: req.params.token});
    });
  });

  module.exports = router;