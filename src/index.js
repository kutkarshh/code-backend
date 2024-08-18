// require("dotenv").config({path:'./.env'});
// import dotenv from 'dotenv/config';
import connectDB from './db/index.js';

import dotenv from 'dotenv';

dotenv.config(
    { path: './.env' }
);

connectDB()

/*
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("Connected to MongoDB");
        app.on("error", (error) => {
            console.error("Failed to connect to MongoDB", error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("Failed to connect to MongoDB", error);
        throw error;
    }
})()
*/