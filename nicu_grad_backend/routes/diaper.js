const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { wetCount, dirtyCount, stoolNotes, diaperWeight, loggedBy, measuredAt } = req.body;

  if (wetCount == null || dirtyCount == null || !measuredAt) {
    return res.status(400).json({ error: 'Wet, dirty, and date are required' });
  }

  try {
    const entry = await prisma.diaper.create({
      data: {
        wetCount,
        dirtyCount,
        stoolNotes: stoolNotes || '',
        diaperWeight: diaperWeight ? parseFloat(diaperWeight) : null,
        loggedBy: loggedBy || null,
        measuredAt: new Date(measuredAt),
      },
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error('Error saving diaper entry:', err);
    res.status(500).json({ error: 'Failed to save diaper entry' });
  }
});

router.get('/', async (req, res) => {
  try {
    const all = await prisma.diaper.findMany({
      orderBy: { measuredAt: 'desc' },
    });
    res.json(all);
  } catch (err) {
    console.error('Error fetching diaper entries:', err);
    res.status(500).json({ error: 'Failed to fetch diaper entries' });
  }
});

module.exports = router;
