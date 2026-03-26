const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health Check
app.get('/', (req, res) => {
  res.send('NICU Grad Backend Running!');
});

// Routes
app.use('/growth', require('./routes/growth'));
app.use('/feeding', require('./routes/feeding'));
app.use('/diaper', require('./routes/diaper'));
app.use('/vitals', require('./routes/vitals'));
app.use('/medication', require('./routes/medication'));
app.use('/sleep', require('./routes/sleep'));
app.use('/health-events', require('./routes/healthEvents'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
