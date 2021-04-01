function isAuth(req, res, next){
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(401).send('You are not authorized to view this resource');
    }
}


function isAdmin(req, res, next) {
    if (req.isAuthenticated()) {
        if (req.user.admin) {
            next();
        }
    }
    res.status(401).send('You are not authorized to view this resource');
}

function isMod(req, res, next) {
    if (req.isAuthenticated()) {
        if (req.user.moderator) {
            next();
        }
    }
    res.status(401).send('You are not authorized to view this resource');
}

module.exports = {isAuth, isAdmin, isMod};