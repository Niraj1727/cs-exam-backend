const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    chapter: { type: String, required: true }, // Name of the chapter
    question: { type: String, required: true }, // Question text
    answer: { type: String, required: true }, // Answer text
    createdAt: { type: Date, default: Date.now }, // Timestamp
});

module.exports = mongoose.model('Question', QuestionSchema);
