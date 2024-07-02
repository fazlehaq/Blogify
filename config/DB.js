require("dotenv").config();
const mongoose = require('mongoose');
const connectDB = () => mongoose.connect(process.env.DB_URI);

module.exports = { connectDB }