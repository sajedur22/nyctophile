const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());

// In-memory storage
const members = new Map();
const candidates = new Map();
// At the top of your server.js, after members Map:
const votersWhoVoted = new Set();


/**
 * POST /api/voters
 * Create a new voter
 */
app.post('/api/voters', (req, res) => {
  const { voter_id, name, age } = req.body;

  // Validate request body
  if (!voter_id || !name || age === undefined) {
    return res.status(400).json({
      success: false,
      error: "voter_id, name, and age are required"
    });
  }

  if (age < 0 || age > 150) {
    return res.status(400).json({
      success: false,
      error: "age must be between 0 and 150"
    });
  }

  const id = String(voter_id);

  // Check duplicate
  if (members.has(id)) {
    return res.status(409).json({
      success: false,
      error: `voter with id: ${id} already exists`
    });
  }

  // Create new voter
  const newVoter = {
    voter_id: id,
    name,
    age,
    has_borrowed: false,
    current_book_id: null // optional for borrow/return
  };

  members.set(id, newVoter);

  res.status(201).json({
    success: true,
    data: newVoter
  });
});

/**
 * GET /api/voters
 * Retrieve all voters
 */
app.get('/api/voters', (req, res) => {
  const allVoters = Array.from(members.values());

  res.status(200).json({
    success: true,
    count: allVoters.length,
    voters: allVoters
  });
});

/**
 * GET /api/voters/:id
 * Retrieve voter by ID
 */
app.get('/api/voters/:id', (req, res) => {
  const voterId = String(req.params.id);

  if (!members.has(voterId)) {
    return res.status(404).json({
      success: false,
      error: `voter with id: ${voterId} not found`
    });
  }

  res.status(200).json({
    success: true,
    data: members.get(voterId)
  });
});

/**
 * PUT /api/voters/:id
 * Update voter info
 */
app.put('/api/voters/:id', (req, res) => {
  const voterId = String(req.params.id);
  const { name, age } = req.body;

  if (!members.has(voterId)) {
    return res.status(404).json({
      success: false,
      error: `voter with id: ${voterId} not found`
    });
  }

  if (age !== undefined && (age < 18 || age > 150)) {
    return res.status(400).json({
      success: false,
      error: "age must be between 18 and 150"
    });
  }

  const voter = members.get(voterId);
  if (name !== undefined) voter.name = name;
  if (age !== undefined) voter.age = age;

  members.set(voterId, voter);

  res.status(200).json({
    success: true,
    data: voter
  });
});

/**
 * DELETE /api/voters/:voter_id
 * Remove voter
 */
app.delete('/api/voters/:voter_id', (req, res) => {
  const voterId =String(req.params.voter_id);

  if (!members.has(voterId)) {
    return res.status(404).json({
      success: false,
      error: `voter with id: ${voterId} not found`
    });
  }

  members.delete(voterId);

  res.status(200).json({
    success: true,
    message: `voter with id: ${voterId} has been removed`
  });
});



app.post('/api/candidates', (req, res) => {
  const { candidate_id, name, party, age } = req.body;

  // Validate required fields
  if (!candidate_id || !name || !party) {
    return res.status(400).json({
      success: false,
      error: "candidate_id, name, and party are required"
    });
  }

  // Validate age if provided
  if (age !== undefined && (age < 18 || age > 150)) {
    return res.status(400).json({
      success: false,
      error: "age must be between 18 and 150"
    });
  }

  const id = String(candidate_id);

  // Check duplicate
  if (candidates.has(id)) {
    return res.status(409).json({
      success: false,
      error: `candidate with id: ${id} already exists`
    });
  }

  // Create new candidate with votes default 0
  const newCandidate = {
    candidate_id: id,
    name,
    party,
    age: age || null,
    votes: 0
  };

  candidates.set(id, newCandidate);

  res.status(201).json({
    success: true,
    data: newCandidate
  });
});


/**
 * GET /api/candidates
 * Retrieve all registered candidates
 */
app.get('/api/candidates', (req, res) => {
  const allCandidates = Array.from(candidates.values());

  res.status(200).json({
    success: true,
    count: allCandidates.length,
    candidates: allCandidates
  });
});



// In-memory storage for votes
const votes = new Map();
let nextVoteId = 1; // auto-increment vote ID

// POST /api/vote - Cast a vote
app.post('/api/vote', (req, res) => {
  const { voter_id, candidate_id } = req.body;

  if (!voter_id || !candidate_id) {
    return res.status(400).json({
      success: false,
      error: "voter_id and candidate_id are required"
    });
  }

  const voterId = String(voter_id);
  const candidateId = String(candidate_id);

  // Check if voter exists
  if (!members.has(voterId)) {
    return res.status(404).json({
      success: false,
      error: `voter with id: ${voterId} not found`
    });
  }

  // Check if candidate exists
  if (!candidates.has(candidateId)) {
    return res.status(404).json({
      success: false,
      error: `candidate with id: ${candidateId} not found`
    });
  }

  // Prevent duplicate voting
  if (votersWhoVoted.has(voterId)) {
    return res.status(400).json({
      success: false,
      error: `voter with id: ${voterId} has already cast a vote`
    });
  }

  // Increment candidate votes
  const candidate = candidates.get(candidateId);
  candidate.votes += 1;
  candidates.set(candidateId, candidate);

  // Create vote record
  const voteId = nextVoteId++;
  const timestamp = new Date().toISOString();
  const voteRecord = {
    vote_id: voteId,
    voter_id: voterId,
    candidate_id: candidateId,
    timestamp
  };

  votes.set(voteId, voteRecord);

  // Mark voter as voted
  votersWhoVoted.add(voterId);

  res.status(200).json({
    success: true,
    data: voteRecord
  });
});



app.get('/api/candidates/:id/votes', (req, res) => {
  const candidateId = String(req.params.id);

  // Check if candidate exists
  if (!candidates.has(candidateId)) {
    return res.status(404).json({
      success: false,
      error: `Candidate with id: ${candidateId} not found`
    });
  }

  const candidate = candidates.get(candidateId);

  res.status(200).json({
    candidate_id: candidate.candidate_id,
    votes: candidate.votes
  });
});


/**
 * GET /api/candidates
 * If ?party=PartyName is provided, filter by party
 */
app.get('/api/candidates', (req, res) => {
  const { party } = req.query;

  let result = Array.from(candidates.values());

  if (party) {
    const partyName = party.toLowerCase();
    result = result.filter(c => c.party.toLowerCase() === partyName);
  }

  if (result.length === 0) {
    return res.status(404).json({
      success: false,
      error: party ? `No candidates found for party: ${party}` : "No candidates found"
    });
  }

  // Map to only required fields (without votes)
  const response = result.map(c => ({
    candidate_id: c.candidate_id,
    name: c.name,
    party: c.party
  }));

  res.status(200).json({
    candidates: response
  });
});

/**
 * GET /api/results
 * Retrieve all candidates ranked by votes (descending)
 */
app.get('/api/results', (req, res) => {
  const allCandidates = Array.from(candidates.values());

  if (allCandidates.length === 0) {
    return res.status(404).json({
      success: false,
      error: "No candidates found"
    });
  }

  // Sort by votes descending
  const rankedCandidates = allCandidates
    .sort((a, b) => b.votes - a.votes)
    .map(c => ({
      candidate_id: c.candidate_id,
      name: c.name,
      votes: c.votes
    }));

  res.status(200).json({
    results: rankedCandidates
  });
});


/**
 * GET /api/winners
 * Retrieve winning candidate(s), handling ties
 */
app.get('/api/winners', (req, res) => {
  const allCandidates = Array.from(candidates.values());

  if (allCandidates.length === 0) {
    return res.status(404).json({
      success: false,
      error: "No candidates found"
    });
  }

  // Find max votes
  const maxVotes = Math.max(...allCandidates.map(c => c.votes));

  // Get all candidates with max votes (handle tie)
  const winners = allCandidates
    .filter(c => c.votes === maxVotes)
    .map(c => ({
      candidate_id: c.candidate_id,
      name: c.name,
      votes: c.votes
    }));

  res.status(200).json({
    success: true,
    winners
  });
});



/**
 * GET /api/candidates/:id/timeline
 * Retrieve the timeline of votes for a specific candidate (without voter_id)
 */
app.get('/api/candidates/:id/timeline', (req, res) => {
  const candidateId = String(req.params.id);

  if (!candidates.has(candidateId)) {
    return res.status(404).json({
      success: false,
      error: `Candidate with id: ${candidateId} not found`
    });
  }

  // Filter votes for this candidate
  const candidateVotes = Array.from(votes.values())
    .filter(v => String(v.candidate_id) === candidateId)
    .map(v => ({
      vote_id: v.vote_id,
      timestamp: v.timestamp
    }))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // chronological order

  res.status(200).json({
    candidate_id: candidateId,
    timeline: candidateVotes
  });
});



/**
 * POST /api/vote/weighted
 * Cast a weighted vote based on voter profile status
 */
app.post('/api/vote/weighted', (req, res) => {
  const { voter_id, candidate_id } = req.body;

  const voter = members.get(String(voter_id));
  const candidate = candidates.get(String(candidate_id));

  if (!voter) {
    return res.status(404).json({ success: false, error: "Voter not found" });
  }

  if (!candidate) {
    return res.status(404).json({ success: false, error: "Candidate not found" });
  }

  // Prevent duplicate voting
  if (votersWhoVoted.has(String(voter_id))) {
    return res.status(400).json({ success: false, error: "Voter has already voted" });
  }

  // Determine weight based on profile status
  let weight = 1; // default
  if (voter.status === "verified") weight = 2;
  else if (voter.status === "inactive") weight = 0.5;

  // Cast vote
  candidate.votes += weight;

  // Record the vote
  const voteId = Date.now(); // simple unique id
  const vote = {
    vote_id: voteId,
    voter_id,
    candidate_id,
    weight,
    timestamp: new Date().toISOString()
  };
  votes.set(voteId, vote);
  votersWhoVoted.add(String(voter_id));

  res.status(201).json({
    success: true,
    vote
  });
});


/**
 * GET /api/votes/range
 * Get votes for a candidate within a specific time range
 */
app.get('/api/votes/range', (req, res) => {
  const { candidate_id, from, to } = req.query;

  if (!candidate_id || !from || !to) {
    return res.status(400).json({
      success: false,
      error: "candidate_id, from, and to are required"
    });
  }

  const start = new Date(from);
  const end = new Date(to);

  if (isNaN(start) || isNaN(end)) {
    return res.status(400).json({
      success: false,
      error: "Invalid date format"
    });
  }

  if (start > end) {
    return res.status(400).json({
      success: false,
      error: "invalid interval: from > to"
    });
  }

  // Filter votes
  const votesInRange = Array.from(votes.values()).filter(v =>
    String(v.candidate_id) === String(candidate_id) &&
    new Date(v.timestamp) >= start &&
    new Date(v.timestamp) <= end
  );

  const totalVotes = votesInRange.reduce((sum, v) => sum + (v.weight || 1), 0);

  res.json({
    success: true,
    candidate_id,
    from,
    to,
    votes_gained: totalVotes
  });
});



app.post('/api/ballots/encrypted', (req, res) => {
  const { election_id, ciphertext, zk_proof, voter_pubkey, nullifier, signature } = req.body;

  // Validate input
  if (!election_id || !ciphertext || !zk_proof || !voter_pubkey || !nullifier || !signature) {
    return res.status(400).json({ success: false, error: "All fields are required" });
  }

  // Check for duplicate voting via nullifier
  if (usedNullifiers.has(nullifier)) {
    return res.status(400).json({ success: false, error: "Voter has already voted" });
  }

  // Verify zero-knowledge proof and signature (placeholder)
  const isProofValid = true;
  const isSignatureValid = true;

  if (!isProofValid) {
    return res.status(400).json({ success: false, error: "Invalid ZK proof" });
  }

  if (!isSignatureValid) {
    return res.status(400).json({ success: false, error: "Invalid signature" });
  }

  // Store the ballot securely
  const ballotId = `b_${Math.random().toString(16).slice(2, 8)}`;
  const anchoredAt = new Date().toISOString();

  encryptedVotes.set(ballotId, { election_id, ciphertext, zk_proof, voter_pubkey, nullifier, anchoredAt });
  usedNullifiers.add(nullifier);

  res.status(201).json({
    ballot_id: ballotId,
    status: "accepted",
    nullifier,
    anchored_at: anchoredAt
  });
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
