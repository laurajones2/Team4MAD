const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all medications
router.get('/', async (req, res) => {
  try {
    const medications = await prisma.medication.findMany({
      orderBy: { givenAt: 'desc' },
    });
    res.json(medications);
  } catch (err) {
    console.error('GET /medication error:', err);
    res.status(500).json({ error: 'Failed to fetch medications' });
  }
});

// POST a new medication dose record
router.post('/', async (req, res) => {
  const { name, dosage, givenAt, nextDoseDue } = req.body;

  if (!name || !dosage || !nextDoseDue) {
    return res.status(422).json({ error: 'name, dosage, and nextDoseDue are required' });
  }

  try {
    const medication = await prisma.medication.create({
      data: {
        name,
        dosage,
        givenAt: givenAt ? new Date(givenAt) : new Date(),
        nextDoseDue: new Date(nextDoseDue),
      },
    });
    res.status(201).json(medication);
  } catch (err) {
    console.error('POST /medication error:', err);
    res.status(500).json({ error: 'Failed to create medication record' });
  }
});

// DELETE a medication record
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(422).json({ error: 'Invalid id' });
  }
  try {
    await prisma.medication.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /medication/:id error:', err);
    res.status(500).json({ error: 'Failed to delete medication record' });
  }
});

module.exports = router;
