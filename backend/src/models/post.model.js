const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { TargetAccount } = require('./account.model');
const User = require('./user.model');
const { LEAD_REASONS } = require('../config/constants');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
  },
  target_id: {
    type: DataTypes.UUID,
    references: { model: TargetAccount, key: 'id' },
  },
  text: DataTypes.TEXT,
  url: DataTypes.STRING(255),
  posted_at: DataTypes.DATE,
}, {
  tableName: 'posts',
  timestamps: true,
  createdAt: 'parsed_at',
  updatedAt: false,
});

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.STRING(150),
    primaryKey: true,
  },
  post_id: {
    type: DataTypes.STRING(100),
    references: { model: Post, key: 'id' },
  },
  username: DataTypes.STRING(100),
  text: DataTypes.TEXT,
  is_lead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  lead_reason: {
    type: DataTypes.ENUM(...Object.values(LEAD_REASONS)),
    allowNull: true,
  },
  is_processed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  processed_by: {
    type: DataTypes.UUID,
    references: { model: User, key: 'id' },
    allowNull: true,
  },
  created_at: DataTypes.DATE,
}, {
  tableName: 'comments',
  timestamps: true,
  createdAt: 'parsed_at',
  updatedAt: false,
});

// Associations
Post.belongsTo(TargetAccount, { foreignKey: 'target_id', as: 'target' });
TargetAccount.hasMany(Post, { foreignKey: 'target_id' });

Comment.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });
Post.hasMany(Comment, { foreignKey: 'post_id' });

Comment.belongsTo(User, { foreignKey: 'processed_by', as: 'processor' });

module.exports = { Post, Comment };
