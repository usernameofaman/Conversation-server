const { User } = require("./models/User");
const { Messages } = require("./models/Message");
const { Conversations } = require("./models/Conversation");
const bcrypt = require("bcrypt");

const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

const getMessages = async (req, res) => {
  const { from, to } = req.params;
  if (!from || !to) res.status(301).json({ message: "ID is required" });

  const allMessages = await Messages.find({
    $or: [{ $and: [{ to: to }, { from: from }] }, { $and: [{ to: from }, { from: to }] }],
  });
  res.status(201).json(allMessages);
};

const getConversationByUser = async (req, res) => {
  const { id } = req.params;
  if (!id) res.status(301).json({ message: "ID is required" });

  const allConversations = await Conversations.find({
    $or: [{ to: id }, { from: id }],
  });
  res.status(201).json(allConversations);
};

const searchUser = async (req, res) => {
  let { namefilter } = req.params;
  if (!namefilter) res.status(301).json({ message: "namefilter is required" });
  namefilter = namefilter.toLowerCase();

  const users = await User.find({ name: { $regex: new RegExp(namefilter, "i") } });
  res.status(201).json(users);
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createConversation = async (req, res) => {
  const { from, to, fromName, toName, message } = req.body;
  if (!from || !to || !fromName || !toName) {
    res.status(301).json({ message: "Required Data Missing" });
  }
  const prev = await Conversations.findOne({ from: from, to: to });
  if (prev) {
    res.status(301).json({ message: "Already created" });
    return;
  }
  const created = await new Conversations({ from, to, requestStatus: "PENDING", fromName, toName });
  await created.save();
  wss.clients.forEach((client) => {
    client.send(JSON.stringify(created));
  });

  if (message) {
    const newMessage = new Messages({
      from,
      to,
      message,
    });
    await newMessage.save();
  }
  res.status(201).json(created);
};

const markAccepted = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the conversation by ID
    const conversation = await Conversations.findById(id);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Update the requestStatus to "ACCEPTED"
    conversation.requestStatus = "ACCEPTED";

    // Save the updated conversation
    await conversation.save();
    res.status(200).json({ message: "Conversation updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const addMessage = async (req, res) => {
  const { from, to, message } = req.body;
  if (!from || !to || !message) {
    res.status(301).json({ message: "Required Data Missing" });
  }
  const created = await new Messages({ from, to, message });
  await created.save();

  // Broadcast the WebSocket message to all connected clients
  // const wss = new WebSocket.Server({ server });
  wss.clients.forEach((client) => {
    client.send(JSON.stringify(created));
  });
  res.status(201).json(created);
};

const startServer = async () => {
  wss.on("connection", (ws) => {
    console.log("Connected");
    ws.send("Welcome");
    ws.on("message", (message) => {
      console.log("Received message:", message);
    });
  });
};

module.exports = {
  startServer,
  getMessages,
  getConversationByUser,
  searchUser,
  loginUser,
  registerUser,
  createConversation,
  markAccepted,
  addMessage,
};
