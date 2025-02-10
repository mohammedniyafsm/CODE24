require('dotenv').config();
const mongoose=require('mongoose');
const MongoURL=process.env.DB_URL;


const connectDB=async()=>{
    try {
        const conn = await mongoose.connect(MongoURL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB connected: ${conn.connection.host}`);
    
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}


module.exports = connectDB;
