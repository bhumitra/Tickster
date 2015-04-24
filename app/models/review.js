var mongoose = require('mongoose');

var reviewSchema = mongoose.Schema({
    useremail: String,
    userFirstname: String,
    movieid: String,
    review: String,
    creationDate: Date,
});

module.exports = mongoose.model('Review', reviewSchema);
