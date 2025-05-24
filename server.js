require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection with better error handling
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority'
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Enhanced Snippet Model with validation
const snippetSchema = new mongoose.Schema({
  filename: { 
    type: String, 
    required: [true, 'Filename is required'],
    trim: true,
    maxlength: [100, 'Filename too long']
  },
  code: { 
    type: String, 
    required: [true, 'Code content is required'],
    minlength: [5, 'Code too short']
  },
  creator: { 
    type: String, 
    required: [true, 'Creator name is required'],
    trim: true,
    maxlength: [50, 'Creator name too long']
  },
  language: { 
    type: String,
    trim: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Snippet = mongoose.model('Snippet', snippetSchema);

// Enhanced API Routes
app.get('/api/snippets', async (req, res) => {
  try {
    const snippets = await Snippet.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: snippets.length,
      data: snippets
    });
  } catch (error) {
    console.error('GET /api/snippets error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error while fetching snippets'
    });
  }
});

app.post('/api/snippets', async (req, res) => {
  try {
    const { filename, code, creator } = req.body;

    // Basic validation
    if (!filename || !code || !creator) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields (filename, code, creator)'
      });
    }

    const language = filename.split('.').pop() || 'text';
    
    const newSnippet = new Snippet({
      filename: filename.trim(),
      code: code,
      creator: creator.trim(),
      language: language.toLowerCase()
    });

    const savedSnippet = await newSnippet.save();
    
    res.status(201).json({
      success: true,
      data: savedSnippet
    });

  } catch (error) {
    console.error('POST /api/snippets error:', error);
    
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    // Other errors
    res.status(500).json({
      success: false,
      error: 'Failed to save snippet to database'
    });
  }
});

app.delete('/api/snippets/:id', async (req, res) => {
  try {
    const snippet = await Snippet.findByIdAndDelete(req.params.id);
    
    if (!snippet) {
      return res.status(404).json({
        success: false,
        error: 'Snippet not found'
      });
    }
    
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('DELETE /api/snippets error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting snippet'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date()
  });
});

// Start server with better error handling
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
