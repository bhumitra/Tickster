var express = require('express');
var app = express();
var passport = require('passport');
var mongoose = require('mongoose');
var flash = require('connect-flash');

var fs = require('fs');

var connectionString = process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://localhost/tickster';
mongoose.connect(connectionString);

app.use(express.static(__dirname + '/public/'));
app.use('/uploads', express.static(__dirname + '/uploads'));

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

require('./config/passport')(passport); 

app.use(cookieParser()); // parse cookies for authentication
app.set('view engine', 'ejs');

// required for passport
app.use(session({
    secret: 'tickstermovies',
    resave: false,
    saveUninitialized: true
}))

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

require('./app/routes.js')(app, passport); // load routes

app.get('/env', function (req, res) {
    res.send(process.env);
});

app.get('/', function (req, res) {
    res.sendFile('public/tickster.html', { "root": __dirname });
});

app.get('/tickster', function (req, res) {
    res.sendFile('public/tickster.html', { "root": __dirname });
});

app.get('/like/:id/:email', function (req, res) {
   
    var email = req.params.email;
    var id = req.params.id;

    var Like = require('./app/models/like');

    var like = new Like();
    like.useremail = email;
    like.movieid = id;

    Like.findOne({ useremail: email, movieid: id }, function (err, result) {
        if (result == null) {
            like.save(function (err, like) {
                if (err) {
                    return console.error(err);
                }
                else {
                    res.send("Unlike");
                }
            });
        }
    });
});

app.get('/unlike/:id/:email', function (req, res) {

    var email = req.params.email;
    var id = req.params.id;
    var Like = require('./app/models/like');

    var like = new Like();
    like.useremail = email;
    like.movieid = id;

    Like.findOne({ useremail: email, movieid: id }, function (err, result) {
        if (result != null) {
            Like.remove({ useremail: email, movieid: id }, function (err) {
                if (err) {
                    return console.error(err);
                }
                else {
                    res.send("Like");
                }
            });
        }
    });
});


app.get('/getLikes/:email', function (req, res) {
    var email = req.params.email;
    var Like = require('./app/models/like');

    Like.find({ useremail: email }).exec(
        function (err, result) {
            res.send(result);
        });
});


app.get('/displayLikeUnlike/:id/:email', function (req, res) {

    var email = req.params.email;
    var id = req.params.id;
    var Like = require('./app/models/like');

    Like.findOne({ useremail: email, movieid: id }, function (err, result) {
        if (result != null) {
            res.send("Unlike");
        }
        else {
            res.send("Like");
        }
    });
});

app.get('/review/:id/:email/:fname/:review', function (req, res) {

    var email = req.params.email;
    var fname = req.params.fname;
    var id = req.params.id;
    var review = req.params.review;
    var date = new Date();

    var Review = require('./app/models/review');

    var rev = new Review();

    rev.useremail = email;

    rev.userFirstname = fname;

    rev.movieid = id;

    rev.review = review;

    rev.creationDate = date;

    rev.save(function (err, rev) {
        if (err) {
            return console.error(err);
        }
        else {
            console.log("review has been saved");
        }
    });
});

app.get('/getReviews/:id', function (req, res) {
    var id = req.params.id;
    var Review = require('./app/models/review');

    Review.find({ movieid: id }).sort({ creationDate: -1 }).exec(
        function (err, result) {
            // console.log(result);
            res.send(result);
        });
});


app.delete("/deleteReview/:id", function (req, res) {

    var reviewId = req.params.id;
    var Review = require('./app/models/review');
    Review.remove({ _id: reviewId }, function (err) {
        if (err) {
            console.log("error in deleting review");
        }
        else {
            console.log("deleted review");
        }
    });
});

app.get("/editReview/:id/:reviewNew", function (req, res) {

    var reviewId = req.params.id;
    var reviewNew = req.params.reviewNew;
    var Review = require('./app/models/review');

    Review.update({ _id: reviewId }, { $set: { review: reviewNew } }, function (err) {
        console.log("review updated"); if (err) {
            console.log("error in updating review");
        }
        else {
            console.log("updated review");
        }
    });
});

app.get("/getProfile/:email", function (req, res) {

    var email = req.params.email;

    var User = require('./app/models/user');
    console.log(email);
    User.findOne({ 'local.email': email }, function (err, result) {
        if (result != null) {
            res.send(result);
        }
    });
});


app.delete("/deleteAccount/:email", function (req, res) {

    var email = req.params.email;
    var User = require('./app/models/user');
    var name;

    User.findOne({ 'local.email': email }, function (err, result) {
        if (result != null) {
            name = result.local.name;
        }
    });

    User.find({ 'local.email': email }).remove(function (err) {
        if (err) {
            console.log(err);
            console.log("error in deleting USER account");
        }
        else {
            fs.unlink('uploads/' + email, function (err) {
                if (err) throw err;
                console.log('successfully deleted profile pic');
            });

            console.log("deleted account in user collection");
            var Follow = require('./app/models/follow');

            Follow.find({ useremailfollowed: email }).remove(function (err) {
                if (err) {
                    console.log("error in deleting follow");
                }
                else {
                    console.log("deleted all follows");
                    var Like = require('./app/models/like');

                    Like.find({ useremail: email }).remove(function (err) {
                        if (err) {
                            console.log("error in deleting account in like collection");
                        }
                        else {
                           
                            console.log("deleted all likes");
                            var Review = require('./app/models/review');

                            Review.find({ useremail: email }).remove(function (err) {
                                if (err) {
                                    console.log("error in deleting reviews");
                                }
                                else {
                                    console.log("deleted all reviews");
                                    res.send("deleted");
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

app.get("/follow/:follower/:followed", function (req, res) {

    var follower = req.params.follower;
    var followed = req.params.followed;

    var Follow = require('./app/models/follow');

    var follow = new Follow();
    follow.useremailfollower = follower;
    follow.useremailfollowed = followed;

    Follow.findOne({ useremailfollower: follower, useremailfollowed: followed }, function (err, result) {
        console.log(result);
        if (result == null) {
            follow.save(function (err, like) {
                if (err) {
                    return console.error(err);
                }
                else {
                    res.send("Unfollow");
                }
            });
        }
    });
});

app.get("/unfollow/:follower/:followed", function (req, res) {

    var follower = req.params.follower;
    var followed = req.params.followed;
    var Follow = require('./app/models/follow');

    Follow.findOne({ useremailfollower: follower, useremailfollowed: followed }, function (err, result) {
        console.log(result);
        if (result != null) {
            Follow.remove({ useremailfollower: follower, useremailfollowed: followed }, function (err, like) {
                if (err) {
                    return console.error(err);
                }
                else {                    
                    res.send("Follow");
                }
            });
        }
    });
});

app.get('/checkForFollow/:follower/:followed', function (req, res) {

    var follower = req.params.follower;
    var followed = req.params.followed;
    var Follow = require('./app/models/follow');

    Follow.findOne({ useremailfollower: follower, useremailfollowed: followed }, function (err, result) {
        console.log(result);
        if (result != null) {
            res.send("Unfollow");
        }
        else {
            res.send("Follow");
        }
    });
});

app.get('/getFollowedUsers/:follower', function (req, res) {

    var followingUsers = [];
    var follower = req.params.follower;
    var Follow = require('./app/models/follow');
    var User = require('./app/models/user');

    Follow.find({ useremailfollower: follower }).exec(
        function (err, matchedFollowed) {
            // console.log(result);
            if (matchedFollowed != null) {
                matchedFollowed.forEach(function (matchedFolloweduser, index, matchedFollowed) {
                    var query = User.where({ 'local.email': matchedFolloweduser.useremailfollowed });
                    query.findOne(function (err, matchedUser) {
                        if (matchedUser != null) {
                            followingUsers.push(matchedUser);
                            if (index == (matchedFollowed.length - 1)) {
                                res.send(followingUsers);
                            }
                        }
                    });
                })
            }
        });
});


var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port = process.env.OPENSHIFT_NODEJS_PORT || 8085;

app.listen(port, ipaddress);