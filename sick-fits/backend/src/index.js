const cookieParser = require("cookie-parser");
require("dotenv").config({ path: "variables.env" });
const jwt = require('jsonwebtoken');

const createServer = require("./createServer");
const db = require("./db");

const server = createServer();

server.express.use(cookieParser());
// middleware to populate current user
server.express.use((req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const { userId } = jwt.verify(token, process.env.APP_SECRET);
    req.userId = userId;
    console.log('userId', userId);
  }
  next();
});

server.start(
  {
    cors: {
      credentials: true,
      origin: process.env.FRONTEND_URL,
    },
  },
  deets => {
    console.log(`Server is running on http://localhost:${deets.port}`);
  }
);
