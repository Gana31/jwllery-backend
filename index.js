import app from './app.js';
import connectToDatabase from './src/config/dbconfig.js';
import AppConfigModel from './src/models/AppConfigModel.js';
import { setS3BaseUrl } from './src/config/s3BaseUrlCache.js';
import http from 'http';
import { Server } from "socket.io";
import User from './src/models/userModel.js';
import moment from 'moment-timezone';


const startServer = async () => {
  try {
    await connectToDatabase();
    
    const port = process.env.PORT || 8000;
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    io.on('connection', (socket) => {


      socket.on('locationUpdate', async ({ userId, latitude, longitude }) => {
        // console.log(`Location update received ${moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss')}:`, userId, latitude, longitude);
        try {
          await User.findByIdAndUpdate(userId, {
            location: {
              latitude,
              longitude,
              updatedAt: new Date()
            }
          });
        } catch (err) {
          console.error('Error updating location:', err);
        }
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    await AppConfigModel.ensureDefault();
    
    const config = await AppConfigModel.findOne();
    if (config && config.s3BaseUrl) {
      setS3BaseUrl(config.s3BaseUrl);
    }
    
    process.on('unhandledRejection', (err) => {
      console.error(err);
 
      server.close(() => process.exit(1));
    });

    // Start listening on the specified port
    server.listen(port,'0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error(error);
 
    process.exit(1);
  }
};

process.on('uncaughtException', (err) => {
  console.error(err);
  process.exit(1);
});

startServer();
