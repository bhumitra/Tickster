module.exports = function(app, passport) {

    var multer = require('multer');
    app.use(multer({
        dest: "./uploads/"
    }));

	app.get('/login', function(request, response) {
		response.render('login.ejs', { message: request.flash('loginMessage') });
	});

	// process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/success', // redirect to the secure profile section
		failureRedirect : '/login', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// show the signup form
	app.get('/signup', function(request, response) {

		// render the page and pass in any flash data if it exists
		response.render('signup.ejs', { message: request.flash('signupMessage') });
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
	    successRedirect: '/login', 
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash: true // allow flash messages
	}));

	
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/success', isLoggedIn, function(request, response) {
	    response.cookie('userEmail', request.user.local.email, { maxAge: 2592000000 });
	    response.cookie('userName', request.user.local.name, { maxAge: 2592000000 });
        response.redirect('/')
	});

	app.get('/logout', function (request, response) {
	    request.logout();
	    response.clearCookie('userName');
	    response.clearCookie('userEmail');
		response.redirect('/');
	});
};

// route middleware to make sure
function isLoggedIn(request, response, next) {

	// if user is authenticated in the session, carry on
	if (request.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	response.redirect('/');
}
