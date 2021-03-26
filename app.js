//Gives us access to variables set in the .env file via process.env.VARIABLE_NAME
require('dotenv').config()
//imports
const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes.js');
const registerRoutes = require('./routes/registerRoutes.js');
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');

//connect to local database & listen to requests on port 3000
let uri = "mongodb://localhost:27017/Maple";
mongoose.connect(uri,{useNewUrlParser:true, useUnifiedTopology:true})
    .then((result) =>app.listen(3000))
    .catch((error) => console.log(error));
console.log("DB:" + uri);


//register view engine
app.set('view engine', 'ejs');

//----------------------middleware--------------------------//
app.use(express.static("public")); //allows you to use static css file with views
app.use(express.json());//allows to parse JSON from req
app.use(express.urlencoded({extended:true})) // allows you to pass request object from POST
app.use(morgan('dev')); // auto server logger\

    //---------Session Setup---------//

//create session store and link to mongodb Maple database
app.use(session({
    secret : process.env.SECRET,
    resave : false,
    saveUninitialized : false,
    store : MongoStore.create({
        mongoUrl: uri,
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
}));

//flash must be used after session middleware
app.use(flash());

    //--------Passport Authentication----------//
require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());


//debugging middleware
app.use(((req, res, next) => {
    console.log(req.user);
    console.log(req.session)
    next();
}));

//---------------------Routes------------------------//
app.use(userRoutes);
app.use(registerRoutes);

app.get('/registerSyrup', (req,res) => {
    res.render('registerSyrup');
});

app.get('/', (req, res) => {
    res.render('index',{message: req.flash("error")});
});

app.use((req, res) => {
   res.status(404).send('404 error') ;
});
