# Nyctophile Voting System API

A Node.js & Express-based API for managing voters, candidates, and secure election voting with support for encrypted ballots and zero-knowledge proofs.

## Features

- Register and manage voters
- Register and manage candidates
- Cast votes with validation to prevent double voting
- Weighted voting based on voter profile
- Query votes, results, and timelines
- Support for encrypted ballots with ZKP and nullifiers


## Run with Docker
```bash
docker compose up --build
```

## Run locally
```bash
npm install
npm start
```

## API Endpoints

### Voters

- `POST /api/voters` - Register a new voter  
- `GET /api/voters` - Retrieve all voters  
- `GET /api/voters/:id` - Retrieve a voter by ID  
- `PUT /api/voters/:id` - Update voter info (age ≥ 18)  
- `DELETE /api/voters/:voter_id` - Remove a voter

### Candidates

- `POST /api/candidates` - Register a candidate  
- `GET /api/candidates` - Retrieve all candidates  
- `GET /api/candidates?party={party_name}` - Filter candidates by party  
- `GET /api/candidates/:id/votes` - Get votes count for a candidate

### Voting

- `POST /api/votes` - Cast a normal vote  
- `POST /api/votes/secure` - Cast an encrypted vote (ZKP + nullifier)  
- `GET /api/votes/range?candidate_id={id}&from={t1}&to={t2}` - Get votes in a time range  
- `GET /api/results` - Complete ranked results  
- `GET /api/winners` - Get election winners  

## Request Example (Secure Vote)

```json
POST /api/votes/secure
Content-Type: application/json

