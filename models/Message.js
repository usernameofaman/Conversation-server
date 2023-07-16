const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  to: String,
  from: String,
  message: String,
});
const Messages = mongoose.model("Message", messageSchema);

module.exports = {
  Messages,
};
