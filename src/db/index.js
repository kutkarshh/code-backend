import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const db = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\nConnected to MongoDB!! \nDB HOST: ${db.connection.host}`);
    } catch (error) {
        console.log("Failed to connect to MongoDB", error);
        process.exit(1);
    }
}

export default connectDB;