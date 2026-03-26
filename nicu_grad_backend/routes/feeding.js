// nicu_grad_backend/routes/feeding.js

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// POST a new feeding entry
router.post('/', async (req, res) => {
  const {
    method,
    side,
    duration,
    volume,
    weightBeforeG,
    weightAfterG,
    intakeG,
    loggedBy,
    measuredAt,
  } = req.body;

  if (!method || !measuredAt) {
    return res.status(400).json({ error: 'Feeding method and date are required' });
  }

  try {
    const newFeeding = await prisma.feeding.create({
      data: {
        method,
        side,
        duration,
        volume,
        weightBeforeG,
        weightAfterG,
        intakeG,
        loggedBy: loggedBy || null,
        measuredAt: new Date(measuredAt),
      },
    });

    res.status(201).json(newFeeding);
  } catch (error) {
    console.error('Error saving feeding entry:', error);
    res.status(500).json({ error: 'Failed to save feeding entry' });
  }
});

// GET all feeding entries
router.get('/', async (req, res) => {
  try {
    const allFeedings = await prisma.feeding.findMany({
      orderBy: { measuredAt: 'desc' },
    });
    res.json(allFeedings);
  } catch (error) {
    console.error('Error fetching feeding data:', error);
    res.status(500).json({ error: 'Failed to fetch feeding entries' });
  }
});

module.exports = router;
