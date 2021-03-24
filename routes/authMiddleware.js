function isAuth(req, res, next){
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(401).send('You are not authorized to view this resource');
    }
}

//NOT YET IMPLEMENTED
function isAdmin(req, res, next) {}

module.exports = {isAuth, isAdmin};