var LocalStrategy   = require('passport-local').Strategy;

var User = require('../app/models/user');
var fs = require('fs');

module.exports = function(passport) {

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use('local-signup', new LocalStrategy({
        usernameField: 'email',
        passwordField : 'password',
        passReqToCallback : true 
    },
    function(req, email, password, done) {

	    User.findOne({ 'local.email' :  email }, function(err, user) {
            // if there are any errors, return the error
            if (err)
                return done(err);

            if (user) {
                return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
            } else {
				// create the user
                var newUser = new User();
                console.log(req.files.profilePic);
                console.log(req.body.name);

                newUser.local.name = req.body.name;
                newUser.local.aboutme = req.body.aboutme;
                newUser.local.email = email;
                newUser.local.password = newUser.generateHash(password);
                newUser.local.profilePicUrl = '/uploads/' + email;

                newUser.save(function(err) {
                    if (err)
                    {
                        throw err;
                    }
                    else
                    {
                        fs.rename(req.files.profilePic.path, 'uploads/' + email, function (err) {
                            if (err) {
                                console.log('ERROR: ' + err);
                            }
                            else {
                                console.log("saved");
                            }
                        });
                        return done(null, newUser);
                    }
                });
            }
        });
    }));

    passport.use('local-login', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form
         User.findOne({ 'local.email' :  email }, function(err, user) {
      
            if (err)
                return done(err);

            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found')); 

            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Wrong password!')); 

            return done(null, user);
        });
    }));
};
