const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all health events
router.get('/', async (req, res) => {
  try {
    const events = await prisma.healthEvent.findMany({
      orderBy: { recordedAt: 'desc' },
    });
    res.json(events);
  } catch (err) {
    console.error('GET /health-events error:', err);
    res.status(500).json({ error: 'Failed to fetch health events' });
  }
});

// POST a new health event
router.post('/', async (req, res) => {
  const { title, description, recordedAt, photoUrl, videoUrl, tags } = req.body;

  if (!title || !description) {
    return res.status(422).json({ error: 'title and description are required' });
  }

  try {
    const event = await prisma.healthEvent.create({
      data: {
        title,
        description,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
        photoUrl: photoUrl || null,
        videoUrl: videoUrl || null,
        tags: tags || [],
      },
    });
    res.status(201).json(event);
  } catch (err) {
    console.error('POST /health-events error:', err);
    res.status(500).json({ error: 'Failed to create health event' });
  }
});

// DELETE a health event
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(422).json({ error: 'Invalid id' });
  }
  try {
    await prisma.healthEvent.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /health-events/:id error:', err);
    res.status(500).json({ error: 'Failed to delete health event' });
  }
});

module.exports = router;
