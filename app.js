const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes.js');
const session = require('express-session');
const mongoStore = require('connect-mongo')(session);


//connect to local database & listen to requests on port 3000
let uri = "mongodb://localhost:27017/Maple";
mongoose.connect(uri,{useNewUrlParser:true, useUnifiedTopology:true})
    .then((result) =>app.listen(3000))
    .catch((error) => console.log(error));
console.log("DB:" + uri);

//create session store and link to mongodb Maple database
const sessionStore = new mongoStore({
    mongooseConnection : mongoose.connection,
    collection : "sessions"
});

//register view engine
app.set('view engine', 'ejs');

//middleware & static files
app.use(express.static("public")); //allows you to use static css file with views
app.use(express.json());//allows to parse JSON from req
app.use(express.urlencoded({extended:true})) // allows you to pass request object from POST
app.use(morgan('dev')); // auto server logger
app.use(session({
    secret : "secret-key",
    resave : false,
    saveUninitialized : false,
    store : sessionStore
}));



app.get('/', (req, res) => {
    res.render('index')
});

app.get('/register',(req,res) =>{
    res.render('register');
});



//User Routes
app.use(userRoutes)


app.use((req, res) => {
   res.status(404).send('404 error') ;
});
