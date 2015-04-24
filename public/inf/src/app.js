var myApp = angular.module('myApp', ['infinite-scroll']);

myApp.filter('changeUrl', function () {
    return function (input, splitChar, splitIndex) {
        var movieId = input.split(splitChar)[splitIndex];
        var newUrl = "http://content6.flixster.com/movie/" + movieId;
        if (movieId != null) {
            return newUrl;
        } else {
            return "http://d18i5l0cp5i5h1.cloudfront.net/static/images/movie.none.det.gif";
        }
    }
});

var movies =[];
var page = 1;
var total = 0;
var numbersController = function($scope,$http){
    
    $scope.inTheatreMovies = [];
    $scope.loadMore = function () {
        var url = "http://api.rottentomatoes.com/api/public/v1.0/lists/movies/in_theaters.json?page_limit=9" + "&page=" + page + "&country=us&apikey=m8r83jtnrvy92y4w5hxm39cb&callback=JSON_CALLBACK";
        $http.jsonp(url).success(function (data) {
            // console.log("hi");
            movies = data.movies;
            total = data.total;
            console.log(total);

            for (var i = 0; i < movies.length; i++) {
                if (total > $scope.inTheatreMovies.length) {
                    $scope.inTheatreMovies.push(movies[i]);
                }
            }
          
        });
        page = page + 1;

            /*
        for (var i = 0; i < 25; i++) {
            $scope.numbers.push(++$scope.counter);
        };
        */
    }
    $scope.loadMore();
}

myApp.controller('numbersController', numbersController);