// require("dotenv").config({path:'./.env'});
import dotenv from 'dotenv/config';

dotenv.config(
    { path: './.env' }
);

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