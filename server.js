const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());

// In-memory storage
const members = new Map();

// POST /api/members - Create a new member
app.post('/api/members', (req, res) => {
  const { member_id, name, age } = req.body;

  // Validation
  if (!member_id || !name || age === undefined) {
    return res.status(400).json({
      message: "member_id, name, and age are required"
    });
  }

  if (age < 0 || age > 150) {
    return res.status(400).json({
      message: "age must be between 0 and 150"
    });
  }

  // Check for duplicate ID
  if (members.has(member_id)) {
    return res.status(409).json({
      message: `member with id: ${member_id} already exists`
    });
  }

  // Create new member
  const newMember = {
    member_id,
    name,
    age,
    has_borrowed: false
  };

  members.set(member_id, newMember);

  res.status(201).json(newMember);
});

app.get('/api/members/:member_id', (req, res) => {
  const id = String(req.params.member_id);
  const member = members.get(id);
  if (!member) return res.status(404).json({ message: 'Member not found' });
  res.json(member);
});

// GET /api/members - Retrieve all members
app.get('/api/members', (req, res) => {
  const allMembers = Array.from(members.values());
  res.json(allMembers);
});


// PUT /api/members/:member_id - Update member info
app.put('/api/members/:member_id', (req, res) => {
  const id = String(req.params.member_id);
  const member = members.get(id);

  if (!member) {
    return res.status(404).json({ message: 'Member not found' });
  }

  const { name, age } = req.body;

  // Validation
  if (age !== undefined && (age < 12 || age > 150)) {
    return res.status(400).json({ message: 'Age must be at least 12 and maximum 150' });
  }
  if (name !== undefined && typeof name !== 'string') {
    return res.status(400).json({ message: 'Name must be a string' });
  }

  // Update fields
  if (name) member.name = name;
  if (age !== undefined) member.age = age;

  members.set(id, member);
  res.json(member);
});


// POST /api/borrow
app.post('/api/borrow', (req, res) => {
  const { member_id, book_id } = req.body;
  const id = String(member_id);
  const member = members.get(id);

  if (!member) return res.status(404).json({ message: 'Member not found' });
  if (member.has_borrowed) return res.status(400).json({ message: 'Member already has an active borrowed book' });
  if (!book_id) return res.status(400).json({ message: 'book_id is required' });

  member.has_borrowed = true;
  member.current_book_id = book_id;
  members.set(id, member);

  res.json({
    message: `Member ${member.name} successfully borrowed book ID ${book_id}`,
    member
  });
});


app.post('/api/return', (req, res) => {
  const { member_id } = req.body;
  const id = String(member_id);
  const member = members.get(id);

  if (!member) {
    return res.status(404).json({ message: 'Member not found' });
  }

  if (!member.has_borrowed) {
    return res.status(400).json({ message: 'Member has no active borrowed book' });
  }

  // Store the returned book ID for the response
  const returnedBookId = member.current_book_id;

  // Update member's borrowing status
  member.has_borrowed = false;
  member.current_book_id = null;
  members.set(id, member);

  res.json({
    message: `Member ${member.name} successfully returned book ID ${returnedBookId}`,
    member
  });
});








app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
