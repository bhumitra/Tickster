// create the module and name it tickster
var tickster = angular.module('tickster', ['ngRoute', 'ngAnimate', 'angular-flexslider', 'infinite-scroll']);

tickster.filter('changeUrl', function () {
    return function (input, splitChar, splitIndex) {
        var movieId = input.split(splitChar)[splitIndex];
        var newUrl = "http://content6.flixster.com/movie/" + movieId;
        var encodeURL = encodeURIComponent(newUrl);
        //  console.log(newUrl);
        var finalURL = "http://i.embed.ly/1/display/resize?url=" + encodeURL + "&width=300&grow=true&height=350&key=3d7689a432334657b37ea346684c9bde";
        if (movieId != null) {
            return finalURL;
        } else {
            return "http://d18i5l0cp5i5h1.cloudfront.net/static/images/movie.none.det.gif";
        }
    }
});



// route config
tickster.config(function ($routeProvider) {
    $routeProvider

        .when('/', {
            templateUrl: '../views/home.html',
            controller: 'homeController'
        })

        // movie details
        .when('/movie/:id', {
            templateUrl: '../views/movie.html',
            controller: 'movieController'
        })
        // search page
        .when('/search/:query', {
            templateUrl: '../views/search.html',
            controller: 'searchController'
        })
        // user profile
        .when('/profile', {
            templateUrl: '../views/profile.html',
            controller: 'profileController'
        })
        //about tickster
        .when('/about', {
            templateUrl: '../views/about.html',
            controller: 'aboutController'
        })

        .when('/profile/:email', {
            templateUrl: '../views/profile.html',
            controller: 'profileController'
        });
});

var apikey = "m8r83jtnrvy92y4w5hxm39cb";

var flag = false;
var totalmov = 0;
var plimit = 6;

tickster.controller("homeController", ["$scope", "$routeParams", "$http", function ($scope, $routeParams, $http) {
    var page = 1;
    var total = null;
    var upcomingUrl = "http://api.rottentomatoes.com/api/public/v1.0/lists/movies/upcoming.json?page_limit=16&page=1&country=us&apikey=m8r83jtnrvy92y4w5hxm39cb&callback=JSON_CALLBACK";


    $http.jsonp(upcomingUrl).success(function (data) {
        //  console.log(data.movies);
        $scope.upcomingmovies = data.movies;
    });

    $scope.inTheatreMovies = [];
    $scope.loadMore = function () {
        var url = "http://api.rottentomatoes.com/api/public/v1.0/lists/movies/in_theaters.json?page_limit=6" + "&page=" + page + "&country=us&apikey=m8r83jtnrvy92y4w5hxm39cb&callback=JSON_CALLBACK";

        //infinite scrolling
        $http.jsonp(url).success(function (data) {
            var movies = data.movies;
            totalmov = data.total;
         //   console.log(totalmov);
            if (totalmov > $scope.inTheatreMovies.length) {
                for (var i = 0; i < movies.length; i++) {
                    $scope.inTheatreMovies.push(movies[i]);
                }
            }
            // console.log(page);
        });
        page = page + 1;
    }
    $scope.loadMore();
}]);


//MOVIE CONTROLLER
tickster.controller("movieController", ["$scope", "$routeParams", "$http", "$filter", function ($scope, $routeParams, $http, $filter) {
    var id = $routeParams.id;
    var moviesInfoUrl = 'http://api.rottentomatoes.com/api/public/v1.0/movies/' + id + '.json?apikey=' + apikey + '&callback=JSON_CALLBACK';
    var userEmail = $.cookie("userEmail");
    var movieName = "";
    //default date - todays date
    $scope.date = $filter("date")(Date.now(), 'yyyy-MM-dd');

    $http.jsonp(moviesInfoUrl).success(function (data) {

        $scope.movieId = data.id;
        $scope.synopsis = data.synopsis;
        $scope.title = data.title;
        movieName = data.title;
        // console.log(data.posters.thumbnail.split('/movie/')[1]);
        if (data.posters.thumbnail.split('/movie/')[1] != undefined) {
            $scope.poster = "http://content6.flixster.com/movie/" + data.posters.thumbnail.split('/movie/')[1];
        } else {
            $scope.poster = "http://d18i5l0cp5i5h1.cloudfront.net/static/images/movie.none.det.gif";
        }

        //    $scope.poster = "http://content6.flixster.com/movie/" + data.posters.thumbnail.split('/movie/')[1];
        $scope.critics_score = data.ratings.critics_score;
        $scope.audience_score = data.ratings.audience_score;
        $scope.studio = data.studio;
        var g = data.genres;
        $scope.genre = g.toString();
        $scope.rating = data.mpaa_rating;
        $scope.releaseDate = data.release_dates.theater;

        if (userEmail == undefined) {
            $("#favbutton").prop('disabled', true);
            $scope.favtext = "Login To Like!"
            $("#reviewButton").prop('disabled', true);
            $scope.reviewButtonText = "Login to write a Review!"
        }
        else {
            $http.get("/displayLikeUnlike/" + id + "/" + userEmail)
           .success(function (response) {
               $scope.favtext = response;
           });
            $scope.reviewButtonText = "Post Review";
        }

        var castTemp = "";
        $.each(data.abridged_cast, function (idx, obj) {
            if (idx == (Object.keys(data.abridged_cast).length - 1)) {
                castTemp = castTemp + obj.name;
            }
            else {
                castTemp = castTemp + obj.name + ", ";
            }
        });
        $scope.cast = castTemp;

        var directorsTemp = "";
        $.each(data.abridged_directors, function (idx, obj) {
            if (idx == (Object.keys(data.abridged_directors).length - 1)) {
                directorsTemp = directorsTemp + obj.name;
            }
            else {
                directorsTemp = directorsTemp + obj.name + ", ";
            }
        });
        $scope.directors = directorsTemp;

        simurl = data.links.similar + '?limit=4&apikey=' + apikey + '&callback=JSON_CALLBACK';

        $http.jsonp(simurl).success(function (response) {

            $scope.similarMovies = response.movies;
        });
        $scope.fetchReviews(data.id);

    });

    $scope.switchFav = function () {

        var id = $scope.movieId;
        if ($scope.favtext == "Like") {
            $http.get("/like/" + id + "/" + userEmail)
             .success(function (response) {
                 //      console.log("Successfully liked");
                 $scope.favtext = response;
             });

        }
        else {
            $http.get("/unlike/" + id + "/" + userEmail)
             .success(function (response) {
                 //      console.log("Successfully unliked");
                 $scope.favtext = response;
             });
        }
    }

    //********like

    $scope.changeClass = function (favtext) {
        if (userEmail == undefined) {
            return "btn btn-disabled";
        }
        else {
            if (favtext == "Like")
                return "btn btn-success";
            if (favtext == "Unlike")
                return "btn btn-danger";
        }
    }

    //reviews
    $scope.ngClassChange = function () {
        if (userEmail == undefined) {
            return "btn btn-disabled";
        }
        else {
            return "btn btn-primary";
        }
    }

    $scope.reviewfn = function () {
        var id = $scope.movieId;
        var review = $scope.review;
        var firstName = $.cookie("userName").split(' ')[0];
        $http.get("/review/" + id + "/" + userEmail + "/" + firstName + "/" + review)
           .success(function (response) {
               console.log("review posted successfully");
           });
        $scope.review = "";
        $scope.fetchReviews(id);
    }

    $scope.fetchReviews = function (id) {

        $http.get("/getReviews/" + id)
       .success($scope.displayReviews);
    }

    $scope.displayReviews = function (response) {

        $.each(response, function (idx, obj) {
            var date = moment(obj.creationDate).format("ddd, MMM Do YYYY");
            obj.creationDate = date;
            userEmail = $.cookie("userEmail");
            if (obj.useremail == userEmail) {
                obj.displayEditDeleteBtn = true;
            }
            else {
                obj.displayEditDeleteBtn = false;
            }
        });
        $scope.reviews = response;

        var reviewRTURL = "http://api.rottentomatoes.com/api/public/v1.0/movies/" + $scope.movieId + "/reviews.json?review_type=top_critic&page_limit=10&page=1&country=us&apikey=m8r83jtnrvy92y4w5hxm39cb&callback=JSON_CALLBACK";

        $http.jsonp(reviewRTURL).success(function (data) {
            $scope.reviewsRT = data.reviews;

        });
    };

    $scope.deleteReview = function (r_id) {
      //  console.log(r_id);
        var r = confirm("Are you sure you want to delete the Review?");
        if (r == true) {
            $http.delete("/deleteReview/" + r_id)
                .success(function (response) {
                    console.log("review deleted");
                });
            $scope.fetchReviews($scope.movieId);
        }
    }

    var review_modalId;

    $scope.editReviewfn = function (r_id, reviewOld) {
        console.log("updating review");
        $("#newReview").val(reviewOld);
        review_modalId = r_id;
        $scope.fetchReviews($scope.movieId);
    }

    $scope.submitUpdatedReview = function () {
        var reviewNew = $("#newReview").val();
        $http.get("/editReview/" + review_modalId + "/" + reviewNew)
             .success(function (response) {
                 console.log("review updated");
             });
        $scope.fetchReviews($scope.movieId);
    }



    $scope.dispshowtimes = function (form, date) {

        var flag = false;
        showtimesURL = "http://data.tmsapi.com/v1.1/movies/showings?startDate=" + date + "&zip=" + form.zip + "&api_key=9tgadcfyrsvqtzuydytxu6v4";
   //     console.log(showtimesURL);
        $http.get(showtimesURL).success(function (response) {
            movieshows = response;
        //    console.log(movieshows.length);
            for (i = 0; i < movieshows.length; i++) {
        //        console.log(movieshows[i].title);
                if (movieshows[i].title == movieName) {
                    $scope.showtimes = movieshows[i].showtimes;
                    $scope.errmessage = null;
                    flag = true;
                    break;
                }
            }
            //  console.log("after loop");
            if (!flag) {

                $scope.showtimes = [];
                console.log("No showtimes found");
                $scope.errmessage = "No showtimes found for this Zip and Date";
            }
        });
    }
}]);


// Search Controller
tickster.controller("searchController", ["$scope", "$routeParams", "$http","$timeout", function ($scope, $routeParams, $http,$timeout) {
    // alert("hi");
    var pages = 1;
    var totalSearch = 0;
    var totalmov = 0;
    var totalmovmain = 0;
    var query = $routeParams.query;
    var loadstop = 3;
    console.log("Search for "+query);
    $scope.flag = true;

    if (query == "" || query == null || query == undefined) {
        alert("Please enter something in the search box.");
    }
    else {

        $scope.search = [];
        var moviesSearchUrlfinal = 'http://api.rottentomatoes.com/api/public/v1.0' + '/movies.json?q=' + query + '&apikey=' + apikey + '&page_limit=8' + '&page=' + '1' + "&callback=JSON_CALLBACK";
       // console.log(moviesSearchUrlfinal);
        $http.jsonp(moviesSearchUrlfinal).success(function (data) {
            totalmovmain = data.total;
          //  console.log(totalmovmain);
            loadstop = totalmovmain / 20;
         //   console.log(loadstop);
            console.log("***")
         //   console.log(pages);
            console.log("If you scroll down too fast, you may get errors in fetching data from the api as there is a Key Rate Limits of 5 Calls per second for Rotten Tomatoes API");
            if (totalmovmain == 0) {
                $scope.flag = false;
            }
        });
       
        $scope.loadMore = function () {

            var moviesSearchUrl = 'http://api.rottentomatoes.com/api/public/v1.0' + '/movies.json?q=' + query + '&apikey=' + apikey + '&page_limit=20' + '&page=' + pages + "&callback=JSON_CALLBACK";
     
            if (loadstop > pages) {
                $http.jsonp(moviesSearchUrl).success(function (data) {
                        var movies = data.movies;
                        totalmov = data.total;
                        if (totalmov > $scope.search.length) {
                            for (var i = 0; i < movies.length; i++) {
                                $scope.search.push(movies[i]);
                            }
                        }
                });
           //       console.log(pages);
                  pages = pages + 1;
            }             
        }
    //    $scope.loadMore();
    }
}]);

tickster.controller("profileController", ["$scope", "$routeParams", "$http", function ($scope, $routeParams, $http) {

    $scope.getProfile = function () {
        var userEmail = $.cookie("userEmail");
        var emailToFetch = $routeParams.email;

        $http.get("/getProfile/" + emailToFetch)
         .success(function (response) {

             $scope.aboutme = response.local.aboutme;
             $scope.name = response.local.name;
             $scope.email = response.local.email;

             $scope.profilePic = response.local.profilePicUrl;
             //     console.log($scope.profilePic);
             //     console.log(response);
             if (response.local.email == userEmail) {
                 $scope.showDeleteAccountButton = true;
                 $scope.showFollowButton = false;
             }
             else {
                 $scope.showDeleteAccountButton = false;
                 $scope.showFollowButton = true;
                 if (userEmail == undefined) {
                     $("#followButton").prop('disabled', true);
                     $scope.followButtonText = "Login to follow!"
                 }
                 else {
                     $http.get("/checkForFollow/" + userEmail + "/" + emailToFetch)
                         .success(function (response) {
                             $scope.followButtonText = response;
                         });
                 }
             }
         });
    }


    $scope.followUnfollow = function () {
        var userEmail = $.cookie("userEmail");
        var emailToFetch = $routeParams.email;

        if ($scope.followButtonText == "Follow") {
            $http.get("/follow/" + userEmail + "/" + emailToFetch)
             .success(function (response) {
                 console.log("Successfully followed");
                 $scope.followButtonText = response;
             });

        }
        else {
            $http.get("/unfollow/" + userEmail + "/" + emailToFetch)
             .success(function (response) {
                 console.log("Successfully unfollowed");
                 $scope.followButtonText = response;
             });
        }
    }

    $scope.changeFollowClass = function (followButtonText) {
        var userEmail = $.cookie("userEmail");
        if (userEmail == undefined) {
            return "btn btn-disabled";
        }
        else {
            if (followButtonText == "Follow")
                return "btn btn-success";
            if (followButtonText == "Unfollow")
                return "btn btn-danger";
        }
    }

    $scope.deleteAccount = function () {
        var email = $.cookie("userEmail");
     //   console.log(email);
        var r = confirm("Are you sure you want to delete your account?");
        if (r == true) {
            $http.delete("/deleteAccount/" + email)
                .success(function (response) {
          //          console.log(response);
                    if (response == "deleted") {
                        alert("Your Account has been deleted");
                    }
                    window.location.href = '/logout';
                });
        }
    }

    $scope.getLikedMovies = function () {
        $scope.likedMovies = [];
        var emailToFetch = $routeParams.email;
        var i = 0;

        $http.get("/getLikes/" + emailToFetch)
             .success(function (response) {
          //       console.log(response);
                 if (response != null || response != undefined) {
                     for (i = 0; i < response.length; i++) {
                         var favMoviesURL = "http://api.rottentomatoes.com/api/public/v1.0/movies/" + response[i].movieid + ".json?apikey=" + apikey + "&callback=JSON_CALLBACK";
                         $http.jsonp(favMoviesURL).success(function (data) {
                      //       console.log(data);
                             $scope.likedMovies.push(data);
                        //     console.log($scope.likedMovies);
                         });

                     }
                 }
             });
    }

    $scope.getFollowedUsers = function () {
        $scope.followedUsers = [];
        var emailToFetch = $routeParams.email;

        $http.get("/getFollowedUsers/" + emailToFetch)
             .success(getFollowedCallback);
    }

    function getFollowedCallback(response) {
        if (response != null || response != undefined) {
      //      console.log(response);
            angular.forEach(response, function (obj) {
                $scope.followedUsers.push(obj);
            });
        }
    }

    $scope.getProfile();
    $scope.getLikedMovies();
    $scope.getFollowedUsers();
}]);

tickster.controller("aboutController", ["$scope", function ($scope) { }]);


$(document).ready(function () {
    var userEmail = $.cookie("userEmail");
    var userName = $.cookie("userName");
    if (userEmail != undefined) {
        $('#loginButton').text("Logout");
        $('#nameEmail').text("Hi, " + userName.split(' ')[0]);
        $('#loginButton').attr("href", "/logout");
    }
    else {
        $('#loginButton').text("Login");
        $('#loginButton').attr("href", "/login");

    }
});



function appController($scope, $http) {
    $scope.showHideProfileBtn = function () {
        var userEmail = $.cookie("userEmail");
        if (userEmail != undefined) {
            $scope.profileButtonVisible = true;
            $('#profileButton').attr("href", "#/profile/" + userEmail);
        }
        else {
            $scope.profileButtonVisible = false;
        }
    }
    $scope.showHideProfileBtn();


    $scope.search = function () {
        var searchQuery = $scope.queryText;
        if (searchQuery == "" || searchQuery == null || searchQuery == undefined) {
            alert("Enter a movie name in Search Box e.g Avengers ");
        }
        else {
            window.location.href = '#/search/' + searchQuery;
        }
    }

}

