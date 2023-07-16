const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const { getMessages, getConversationByUser, searchUser, loginUser, registerUser, createConversation, markAccepted, addMessage, startServer } = require("./apis");
const server = require("http").createServer(app);
const  { Messages } = require("./models/Message");



app.use(cors());
app.use(express.json());
const port = 4000;

// const uri = "mongodb://127.0.0.1:27017/moviebooking";
const uri = "mongodb+srv://nextjsapp:iphone13@mongod.zjr5omd.mongodb.net/conversation?retryWrites=true&w=majority";

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to the database");
  app.post("/register", registerUser);
  app.post("/conversation", createConversation);
  app.get("/message/:from/:to", getMessages);
  app.get("/conversation/:id", getConversationByUser);
  app.get("/filterUser/:namefilter", searchUser);
  app.post("/login", loginUser);
  app.get("/markAccepted/:id", markAccepted);
  app.post("/message", addMessage);
  
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  startServer()
});

