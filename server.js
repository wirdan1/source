require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Snippet Model
const snippetSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    code: { type: String, required: true },
    creator: { type: String, required: true },
    language: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const Snippet = mongoose.model('Snippet', snippetSchema);

// API Routes
app.get('/api/snippets', async (req, res) => {
    try {
        const snippets = await Snippet.find().sort({ createdAt: -1 });
        res.json(snippets);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching snippets' });
    }
});

app.post('/api/snippets', async (req, res) => {
    try {
        const { filename, code, creator } = req.body;
        const language = filename.split('.').pop();
        
        const newSnippet = new Snippet({
            filename,
            code,
            creator,
            language
        });

        await newSnippet.save();
        res.status(201).json(newSnippet);
    } catch (error) {
        res.status(400).json({ message: 'Error creating snippet' });
    }
});

app.delete('/api/snippets/:id', async (req, res) => {
    try {
        const snippet = await Snippet.findByIdAndDelete(req.params.id);
        if (!snippet) {
            return res.status(404).json({ message: 'Snippet not found' });
        }
        res.json({ message: 'Snippet deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting snippet' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
