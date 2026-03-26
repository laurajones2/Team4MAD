const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// POST a new sleep entry
router.post('/', async (req, res) => {
  const { sleepDate, durationMinutes, quality, loggedBy } = req.body;

  if (!sleepDate || durationMinutes == null) {
    return res.status(400).json({ error: 'Sleep date and duration are required' });
  }

  try {
    const savedSleep = await prisma.sleepLog.create({
      data: {
        sleepDate: new Date(sleepDate),
        durationMinutes,
        quality: quality || 'Unknown',
        loggedBy: loggedBy || null,
      },
    });
    res.status(201).json(savedSleep);
  } catch (error) {
    console.error('Error saving sleep log:', error);
    res.status(500).json({ error: 'Something went wrong saving sleep' });
  }
});

// GET all sleep entries
router.get('/', async (req, res) => {
  try {
    const allSleepLogs = await prisma.sleepLog.findMany({
      orderBy: {
        sleepDate: 'desc',
      },
    });
    res.json(allSleepLogs);
  } catch (error) {
    console.error('Error fetching sleep logs:', error);
    res.status(500).json({ error: 'Something went wrong fetching sleep logs' });
  }
});

module.exports = router;
