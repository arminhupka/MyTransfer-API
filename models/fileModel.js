const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fileSchema = Schema({
    slug: {
        type: String,
        require: true
    },
    dlLink: {
        type: String,
        require: true
    }
})

module.exports = mongoose.model('file', fileSchema);
