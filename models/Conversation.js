const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  to: String,
  from: String,
  requestStatus: String,
  fromName: String,
  toName: String,
});
const Conversations = mongoose.model("Conversations", conversationSchema);

module.exports = {
  Conversations,
};
