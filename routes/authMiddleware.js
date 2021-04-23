function isAuth(req, res, next){
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(401).redirect('/login');
    }
}


function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.admin) {
            next();
    }else{
        res.status(401).send('You are not authorized to view this resource');
    }
}

function isMod(req, res, next) {
    if (req.isAuthenticated()) {
        if (req.user.moderator) {
            next();
        }
    }else{
        res.status(401).send('You are not authorized to view this resource');
    }
}

module.exports = {isAuth, isAdmin, isMod};