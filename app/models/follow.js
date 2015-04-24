var mongoose = require('mongoose');

var followSchema = mongoose.Schema({
    useremailfollower: String,
    useremailfollowed: String,
});

module.exports = mongoose.model('Follow', followSchema);
