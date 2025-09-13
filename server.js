const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
  console.log(`${err.name} - ${err.message}`);
  console.log('Unhandled exception, shutting down...');
  process.exit(1);
});

dotenv.config({ path: `${__dirname}/config.env` });

const app = require('./app');

const DB = process.env.DB.replace('<PASSWORD>', process.env.DB_PASSWORD);

mongoose.connect(DB).then(() => {
  console.log('DB connection succesful!');
});

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log(`${err.name} - ${err.message}`);
  console.log('Unhandled rejection, shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
