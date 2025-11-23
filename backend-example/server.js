/**
 * Simple Express.js backend for Runway Explorer Share API
 * This is a minimal example - adapt to your needs
 * 
 * Requirements:
 * - npm install express cors
 * 
 * Run with: node server.js
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3008;

// Enable CORS for your frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:3000'], // Add your production domain
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' })); // Increase limit for flight data

// In-memory storage (use a database in production!)
const shares = new Map();

// Cleanup expired shares every hour
setInterval(() => {
  const now = Date.now();
  for (const [id, share] of shares.entries()) {
    if (share.expiresAt && share.expiresAt < now) {
      shares.delete(id);
      console.log(`Deleted expired share: ${id}`);
    }
  }
}, 60 * 60 * 1000);

/**
 * Create a new share
 * POST /api/shares
 * Body: { encryptedData: string, expiresIn?: number }
 */
app.post('/api/shares', (req, res) => {
  try {
    const { encryptedData, expiresIn } = req.body;
    
    if (!encryptedData || typeof encryptedData !== 'string') {
      return res.status(400).json({ error: 'Invalid encryptedData' });
    }
    
    // Generate unique ID
    const id = crypto.randomBytes(16).toString('hex');
    
    // Calculate expiration
    const expiresAt = expiresIn 
      ? Date.now() + (expiresIn * 1000)
      : Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days default
    
    // Store the share
    shares.set(id, {
      encryptedData,
      expiresAt,
      createdAt: Date.now()
    });
    
    console.log(`Created share: ${id}, expires: ${new Date(expiresAt).toISOString()}`);
    
    res.status(201).json({
      id,
      expiresAt: new Date(expiresAt).toISOString()
    });
    
  } catch (error) {
    console.error('Error creating share:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get a share by ID
 * GET /api/shares/:id
 */
app.get('/api/shares/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || !/^[0-9a-f]{32}$/.test(id)) {
      return res.status(400).json({ error: 'Invalid share ID' });
    }
    
    const share = shares.get(id);
    
    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }
    
    // Check if expired
    if (share.expiresAt && share.expiresAt < Date.now()) {
      shares.delete(id);
      return res.status(404).json({ error: 'Share has expired' });
    }
    
    console.log(`Retrieved share: ${id}`);
    
    res.json({
      encryptedData: share.encryptedData
    });
    
  } catch (error) {
    console.error('Error retrieving share:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    shares: shares.size,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Share API server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
