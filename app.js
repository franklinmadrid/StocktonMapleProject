const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes.js');


//connect to local database & listen to requests on port 3000
const url = "mongodb://localhost:27017/MapleProject";
mongoose.connect(url,{useNewUrlParser:true, useUnifiedTopology:true})
    .then((result) =>app.listen(3000))
    .catch((error) => console.log(error));

//register view engine
app.set('view engine', 'ejs');

//middleware & static files
app.use(express.static("public")); //allows you to use static css file with views
app.use(express.urlencoded({extended:true})) // allows you to pass request object from POST
app.use(morgan('dev')); // auto server logger


app.get('/', (req, res) => {
    res.render('index')
});

app.get('/register',(req,res) =>{
    res.render('register');
});

app.get('/registerTree', (req,res) => {
    res.render('registerTree');
});

//User Routes
app.use()


app.use((req, res) => {
   res.status(404).send('404 error') ;
});
