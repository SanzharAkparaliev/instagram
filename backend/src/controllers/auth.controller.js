const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email жана password керек' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Email же password туура эмес' });
    }

    const token = generateToken(user.id);

    res.json({
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Сервер катасы' });
  }
};

const getMe = async (req, res) => {
  res.json({ user: req.user.toJSON() });
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Бул email колдонулуп жатат' });
    }

    const user = await User.create({ name, email, password, role });
    res.status(201).json({ user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ error: 'Колдонуучу түзүүдө ката' });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password'] } });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Колдонуучуларды алуу катасы' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Колдонуучу табылган жок' });
    if (user.id === req.user.id) return res.status(400).json({ error: 'Өзүңүздү өчүрүүгө болбойт' });
    await user.destroy();
    res.json({ message: 'Өчүрүлдү' });
  } catch (error) {
    res.status(500).json({ error: 'Өчүрүүдө ката' });
  }
};

module.exports = { login, getMe, createUser, getUsers, deleteUser };
