const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TargetAccount = sequelize.define('TargetAccount', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  url: {
    type: DataTypes.STRING(255),
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'target_accounts',
  timestamps: true,
});

const ParserAccount = sequelize.define('ParserAccount', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  login: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  proxy: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('idle', 'parsing', 'banned', 'error'),
    defaultValue: 'idle',
  },
  last_used: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cookies: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'parser_accounts',
  timestamps: true,
});

module.exports = { TargetAccount, ParserAccount };
