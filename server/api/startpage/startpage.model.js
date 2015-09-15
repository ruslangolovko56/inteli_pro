'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var StartpageSchema = new Schema({
    user: { type: Schema.ObjectId, ref: 'User' },
    attachment: {
        bucket: String,
        etag: String,
        key: String,
        location: String
    },
    instruction: { type: String, default: '' },
    title: String,
    tags: [{
        text: { type: String, lowercase: true, trim: true },
        _id: false
    }],
    buttonText: String,
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now }
});

StartpageSchema
    .virtual('strTag')
    .get(function() {
        var strTag = "";
        this.tags.forEach(function(tag) {
            strTag += tag.text + " ";
        });
        return strTag;
    });

module.exports = mongoose.model('Startpage', StartpageSchema);