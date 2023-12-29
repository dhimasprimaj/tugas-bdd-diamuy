const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const collection = require('./loginschema');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb+srv://dhimas:dhimas@margincall.0rgwzw3.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

// Create a Todo schema
const todoSchema = new mongoose.Schema({
    task: { type: String, required: true },
});
const Todo = mongoose.model('Todo', todoSchema);


app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Render login page
app.get('/', (req, res) => {
    res.render('login');
});

// Render signup page
app.get('/signup', (req, res) => {
    res.render('signup');
});

// Register User
app.post('/signup', async (req, res) => {
    const data = {
        name: req.body.username,
        password: req.body.password
    }

    // Check if the username already exists in the database
    const existingUser = await collection.findOne({ name: data.name });

    if (existingUser) {
        res.send('User already exists. Please choose a different username.');
    } else {
        // Hash the password using bcrypt
        const saltRounds = 10; // Number of salt rounds for bcrypt
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);

        data.password = hashedPassword; // Replace the original password with the hashed one

        const userdata = await collection.insertMany(data);
        console.log(userdata);
        res.redirect('/');
    }
});

// Login user
app.post('/login', async (req, res) => {
    try {
        const check = await collection.findOne({ name: req.body.username });
        if (!check) {
            res.send('User name cannot be found');
        }

        // Compare the hashed password from the database with the plaintext password
        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);

        if (!isPasswordMatch) {
            res.send('Wrong Password');
        } else {
            // Render the home page
            res.render('home');
        }
    } catch {
        res.send('Wrong Details');
    }
});

// Create a new todo
app.post('/todos', async (req, res) => {
    try {
        const todo = new Todo({ task: req.body.task });
        await todo.save();
        res.status(201).json(todo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all todos
app.get('/todos', async (req, res) => {
    try {
        const todos = await Todo.find();
        res.json(todos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a todo
app.put('/todos/:id', async (req, res) => {
    try {
        const todo = await Todo.findByIdAndUpdate(req.params.id, { task: req.body.task }, { new: true });
        res.json(todo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a todo
app.delete('/todos/:id', async (req, res) => {
    try {
        const todo = await Todo.findByIdAndRemove(req.params.id);
        res.json(todo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});