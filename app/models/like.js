var mongoose = require('mongoose');

var likeSchema = mongoose.Schema({
        useremail: String,
        movieid: String,
});

module.exports = mongoose.model('Like', likeSchema);
