import mongoose from 'mongoose';
import UserModel from '../models/userModel.js';

mongoose.set('strictQuery', false);

export default async function connectToDatabase() {
  try {
    const data = await mongoose.connect(`${process.env.DATABASE_URL}`);
    console.log(`Database server connected at port: ${data.connection.port}`);
    await UserModel.ensureAdminUser();
    // console.log(`Database server connected at host: ${data.connection.host}`);
  } catch (error) {
    console.error(error);
  }
}
