const { Op } = require('sequelize');
const { Comment } = require('../models/post.model');
const { Post } = require('../models/post.model');
const { TargetAccount } = require('../models/account.model');
const { detectLeadsInBatch } = require('../services/lead.service');

// GET /api/comments
const getComments = async (req, res) => {
  try {
    const {
      is_lead,
      is_processed,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};
    if (is_lead !== undefined) where.is_lead = is_lead === 'true';
    if (is_processed !== undefined) where.is_processed = is_processed === 'true';
    if (search) where.text = { [Op.iLike]: `%${search}%` };

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: comments, count } = await Comment.findAndCountAll({
      where,
      include: [
        {
          model: Post,
          as: 'post',
          attributes: ['id', 'url', 'text'],
          include: [
            {
              model: TargetAccount,
              as: 'target',
              attributes: ['username'],
            },
          ],
        },
      ],
      order: [['parsed_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      comments,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Комментарийлерди алуу катасы' });
  }
};

// POST /api/comments/bulk — parser жөнөтөт
const bulkCreateComments = async (req, res) => {
  try {
    const { comments } = req.body;
    if (!Array.isArray(comments) || comments.length === 0) {
      return res.status(400).json({ error: 'comments массиви керек' });
    }

    const withLeads = await detectLeadsInBatch(comments);

    // Лиддерди гана сактоо
    const leadsOnly = withLeads.filter((c) => c.is_lead);

    if (leadsOnly.length === 0) {
      return res.status(201).json({
        total_checked: comments.length,
        created: 0,
        leads_detected: 0,
      });
    }

    // Лиддердин постторун гана түзүү (target_id жана url менен)
    const postMap = new Map();
    leadsOnly.forEach(c => {
      if (c.post_id && !postMap.has(c.post_id)) {
        postMap.set(c.post_id, { target_id: c.target_id, url: c.post_url });
      }
    });
    for (const [pid, info] of postMap) {
      await Post.findOrCreate({
        where: { id: pid },
        defaults: { id: pid, text: '', url: info.url || '', target_id: info.target_id || null, parsed_at: new Date() },
      });
    }

    const results = await Comment.bulkCreate(leadsOnly, {
      updateOnDuplicate: ['text', 'is_lead', 'lead_reason'],
      returning: true,
    });

    res.status(201).json({
      total_checked: comments.length,
      created: results.length,
      leads_detected: results.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Комментарийлерди сактоо катасы' });
  }
};

// PATCH /api/comments/:id/process
const processComment = async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Комментарий табылган жок' });

    await comment.update({
      is_processed: true,
      processed_by: req.user.id,
    });

    res.json({ comment });
  } catch (error) {
    res.status(500).json({ error: 'Обработка катасы' });
  }
};

// GET /api/comments/stats
const getStats = async (req, res) => {
  try {
    const total = await Comment.count();
    const leads = await Comment.count({ where: { is_lead: true } });
    const processed = await Comment.count({ where: { is_processed: true } });
    const new_leads = await Comment.count({ where: { is_lead: true, is_processed: false } });

    res.json({ total, leads, processed, new_leads });
  } catch (error) {
    res.status(500).json({ error: 'Статистика алуу катасы' });
  }
};

// DELETE /api/comments/cleanup — эски лид эмес комментарийлерди тазалоо
const cleanupComments = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const deleted = await Comment.destroy({
      where: {
        is_lead: false,
        parsed_at: { [Op.lt]: cutoff },
      },
    });

    // Комментарийсиз калган постторду да тазалоо
    const orphanPosts = await Post.findAll({
      include: [{ model: Comment, required: false }],
      where: { '$Comments.id$': null },
    });
    for (const post of orphanPosts) {
      await post.destroy();
    }

    res.json({ deleted_comments: deleted, deleted_posts: orphanPosts.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Тазалоо катасы' });
  }
};

module.exports = { getComments, bulkCreateComments, processComment, getStats, cleanupComments };
