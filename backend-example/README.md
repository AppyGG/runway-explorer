# Runway Explorer - Share API Backend

Simple backend API for the Runway Explorer zero-knowledge share feature.

## Quick Start

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm start
```

Server will run on `http://localhost:3000`

### Test the API

```bash
# Health check
curl http://localhost:3000/health

# Create a share (example)
curl -X POST http://localhost:3000/api/shares \
  -H "Content-Type: application/json" \
  -d '{"encryptedData":"base64encodeddata","expiresIn":2592000}'

# Get a share (replace {id} with actual share ID)
curl http://localhost:3000/api/shares/{id}
```

## API Endpoints

### POST /api/shares

Create a new share.

**Request:**
```json
{
  "encryptedData": "base64-encoded-encrypted-payload",
  "expiresIn": 2592000
}
```

- `encryptedData` (required): Base64 encoded encrypted data
- `expiresIn` (optional): Expiration time in seconds (default: 30 days)

**Response:**
```json
{
  "id": "a1b2c3d4e5f6...",
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

### GET /api/shares/:id

Retrieve a share by ID.

**Response:**
```json
{
  "encryptedData": "base64-encoded-encrypted-payload"
}
```

**Error Responses:**
- `404`: Share not found or expired
- `400`: Invalid share ID format

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "shares": 5,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)

### CORS Configuration

By default, allows requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:4173` (Vite preview)

Add your production domain in `server.js`:

```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-domain.com'],
  // ...
}));
```

## Storage

### Current Implementation

Uses **in-memory Map** for storage. This means:
- ⚠️ All data lost on server restart
- ⚠️ Not suitable for production
- ✅ Good for development/testing

### Production Recommendations

Replace in-memory storage with a database:

#### PostgreSQL Example

```sql
CREATE TABLE shares (
  id VARCHAR(32) PRIMARY KEY,
  encrypted_data TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  access_count INTEGER DEFAULT 0
);

CREATE INDEX idx_expires_at ON shares(expires_at);
```

#### MongoDB Example

```javascript
const shareSchema = new Schema({
  _id: String,
  encryptedData: String,
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  accessCount: { type: Number, default: 0 }
});

shareSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

## Cleanup

The server automatically deletes expired shares every hour. For production:

1. Use database TTL/expiration features
2. Run a scheduled job (cron)
3. Implement lazy deletion on access

## Security Considerations

### Zero-Knowledge Architecture

- Server never receives encryption keys
- Server cannot decrypt stored data
- Server only stores encrypted blobs

### Rate Limiting

Add rate limiting in production:

```javascript
const rateLimit = require('express-rate-limit');

const createShareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // limit each IP to 10 requests per windowMs
});

app.post('/api/shares', createShareLimiter, ...);
```

### Input Validation

```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/shares', [
  body('encryptedData').isString().isLength({ min: 1, max: 5000000 }),
  body('expiresIn').optional().isInt({ min: 60, max: 31536000 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ...
});
```

### HTTPS

Always use HTTPS in production:

```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(443);
```

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  share-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - DATABASE_URL=postgresql://...
    restart: unless-stopped
```

### Cloud Platforms

#### Heroku

```bash
heroku create runway-explorer-share-api
git push heroku main
```

#### Railway

```bash
railway init
railway up
```

#### Vercel (Serverless)

Convert to serverless functions in `api/shares.js`:

```javascript
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    // Create share
  } else if (req.method === 'GET') {
    // Get share
  }
};
```

## Monitoring

### Logging

Add structured logging:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Metrics

Track important metrics:

```javascript
let metrics = {
  totalShares: 0,
  totalAccesses: 0,
  errors: 0
};

app.get('/metrics', (req, res) => {
  res.json(metrics);
});
```

## Testing

```bash
# Install dev dependencies
npm install --save-dev jest supertest

# Run tests
npm test
```

Example test:

```javascript
const request = require('supertest');
const app = require('./server');

describe('Share API', () => {
  test('POST /api/shares creates a share', async () => {
    const response = await request(app)
      .post('/api/shares')
      .send({ encryptedData: 'test123' })
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('expiresAt');
  });

  test('GET /api/shares/:id retrieves a share', async () => {
    // First create a share
    const createResponse = await request(app)
      .post('/api/shares')
      .send({ encryptedData: 'test123' });
    
    const shareId = createResponse.body.id;
    
    // Then retrieve it
    const response = await request(app)
      .get(`/api/shares/${shareId}`)
      .expect(200);
    
    expect(response.body.encryptedData).toBe('test123');
  });
});
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### CORS Errors

Ensure your frontend origin is in the CORS configuration:

```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-frontend.com']
}));
```

### Memory Issues

If running out of memory with in-memory storage, implement:
1. Maximum shares limit
2. Database storage
3. Regular cleanup

## License

MIT
