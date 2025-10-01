const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Logs uncaught error and exits before the server crashes
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled exception, shutting down...');
  process.exit(1);
});

// Loads in the config file
dotenv.config({ path: `${__dirname}/config.env` });

const app = require('./app');

// Injects the database password
const DB = process.env.DB.replace('<PASSWORD>', process.env.DB_PASSWORD);

// Connects to the database
mongoose.connect(DB).then(() => {
  console.log('DB connection succesful!');
});

// Starts the sever on a port
const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Logs error and exits when the database connection is rejected
process.on('unhandledRejection', (err) => {
  console.log(`${err.name} - ${err.message}`);
  console.log('Unhandled rejection, shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
