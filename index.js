import app from './app.js';
import connectToDatabase from './src/config/dbconfig.js';
import AppConfigModel from './src/models/AppConfigModel.js';
import { setS3BaseUrl } from './src/config/s3BaseUrlCache.js';


const startServer = async () => {
  try {
    await connectToDatabase();
    
    const port = process.env.PORT || 7000;
    const server = app.listen(port, () => {
      console.log(`App is listening on port ${port}`);
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
