const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async () => {
  return await User.find().select('-password');
};

exports.createUser = async (data) => {
  const { username, password, email, role = 'user' } = data;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = new User({
    username,
    password: hashedPassword,
    email,
    role
  });
  
  return await user.save();
};

exports.findByUsername = async (username) => {
  return await User.findOne({ username });
};

exports.findById = async (id) => {
  return await User.findById(id).select('-password');
};

exports.updateUser = async (id, userData) => {
  if (userData.password) {
    userData.password = await bcrypt.hash(userData.password, 10);
  }
  return await User.findByIdAndUpdate(id, userData, { new: true }).select('-password');
};
