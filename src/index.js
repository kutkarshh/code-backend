// require("dotenv").config({path:'./.env'});
// import dotenv from 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config();
import { app } from './app.js';
import connectDB from './db/index.js';


// Start the server only after the database connection is established
connectDB().then(() => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT || 3000, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    })
    app.on("error", (error) => {
        console.error("Failed to connect to MongoDB", error);
        throw error;
    })
}).catch(error => {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
})

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