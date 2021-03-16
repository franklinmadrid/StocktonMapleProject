const express = require('express');
const app = express();
const morgan = require('morgan');
const User = require('./models/user');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


//connect to local database & listen to requests on port 3000
const url = "mongodb://localhost:27017/UserPool";
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

app.post('/users',async (req,res) =>{
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        req.body.password = hashedPassword;
        const user = new User(req.body);
        user.save()
            .then((result) => {
                res.redirect("/");
            })
            .catch((err) => console.log(err));
    } catch{
        res.status(500);
    }
});

app.post('/users/login', async (req,res) =>{
    console.log(req.body);
    User.find({username : req.body.username}, async (err, data) =>{
        if(err){
            console.log(err)
        }else if(data.length == 0){
            console.log('User Doesnt exist')
            return res.status(400).send("User doesn't exist")
        }else{
            try{
                if(await bcrypt.compare(req.body.password,data[0].password)){
                    res.redirect("/users/" + data[0]._id);
                }else{
                    res.send('wrong password');
                }
            } catch{
                res.status(500).send();
            }
        }


    });
});

app.get('/users/:id', async (req,res) =>{
    const id = req.params.id;
    await User.findById(id)
        .then(result => {
            if(result == null){
                res.status(404).send('404 error') ;
            }
            res.render('user',{user: result, title: result.username + "'s profile"})
        })
        .catch(err => {
            console.log(err);
        });
});

app.use((req, res) => {
   res.status(404).send('404 error') ;
});
