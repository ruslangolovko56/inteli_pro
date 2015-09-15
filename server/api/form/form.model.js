'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var FormSchema = new Schema({
    user: { type: Schema.ObjectId, ref: 'User' },
    attachment: {
        bucket: String,
        etag: String,
        key: String,
        location: String
    },
    text: { type: String, default: '' },
    title: String,
    tags: [{
        text: { type: String, lowercase: true, trim: true },
        _id: false
    }],
    buttonText: String,
    fields: [{ type: Schema.ObjectId, ref: 'Field' }],
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now }
});

FormSchema
    .virtual('strTag')
    .get(function() {
        var strTag = "";
        this.tags.forEach(function(tag) {
            strTag += tag.text + " ";
        });
        return strTag;
    });

module.exports = mongoose.model('Form', FormSchema);
