const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST a new vitals entry
router.post('/', async (req, res) => {
  const { temp, hr, br, spo2, note, loggedBy, measuredAt } = req.body;

  if (!temp || !hr || !br || !spo2 || !measuredAt) {
    return res.status(400).json({ error: 'All vitals and timestamp are required' });
  }

  try {
    const newEntry = await prisma.vitals.create({
      data: {
        temp: parseFloat(temp),
        hr: parseInt(hr),
        br: parseInt(br),
        spo2: parseInt(spo2),
        note: note || '',
        loggedBy: loggedBy || null,
        measuredAt: new Date(measuredAt),
      },
    });
    res.status(201).json(newEntry);
  } catch (err) {
    console.error('Error saving vitals:', err);
    res.status(500).json({ error: 'Failed to save vitals entry' });
  }
});

// GET all vitals entries
router.get('/', async (req, res) => {
  try {
    const all = await prisma.vitals.findMany({
      orderBy: { measuredAt: 'desc' },
    });
    res.json(all);
  } catch (err) {
    console.error('Error fetching vitals:', err);
    res.status(500).json({ error: 'Failed to fetch vitals' });
  }
});

module.exports = router;
