const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  try {
    const payload = { id };
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '30d' });
    return token;
  } catch (error) {
    console.error('Error generating token:', error.message);
    return null; 
  }
};




module.exports = { generateToken };