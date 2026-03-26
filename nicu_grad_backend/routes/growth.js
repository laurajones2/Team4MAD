// nicu_grad_backend/routes/growth.js

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// POST a new growth entry
router.post('/', async (req, res) => {
  const { weightG, measuredAt, notes, loggedBy } = req.body;

  if (!weightG || !measuredAt) {
    return res.status(400).json({ error: 'Weight and date are required' });
  }

  try {
    const savedGrowth = await prisma.growth.create({
      data: {
        weightG,
        measuredAt: new Date(measuredAt),
        notes: notes || "",
        loggedBy: loggedBy || null,
      },
    });
    res.status(201).json(savedGrowth);
  } catch (error) {
    console.error('Error saving growth:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET all growth entries
router.get('/', async (req, res) => {
  try {
    const allGrowth = await prisma.growth.findMany({
      orderBy: {
        measuredAt: 'asc',
      },
    });
    res.json(allGrowth);
  } catch (error) {
    console.error('Error fetching growth data:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
