# Enhanced Chain Matching Algorithm (A→B→C)

## 📋 Overview

The **Chain Matching Algorithm** enables multi-party swaps on Swaply, allowing users to find compatible exchanges even when direct swaps aren't possible. Instead of just matching A↔B, the system can discover chains like A→B→C→A where everyone gets what they want.

### Key Features

- **Direct Matching (A↔B)**: Traditional two-party swaps
- **Triple Chain Matching (A→B→C→A)**: Three-party circular swaps
- **Extensible Architecture**: Ready for N-party chains (4+)
- **Composite Scoring**: Combines 4 weighted factors for intelligent matching
- **Constraint Solver**: Respects user preferences (distance, value, reputation)
- **Explainability**: Clear reasons why matches were suggested
- **Learning System**: Improves from user feedback over time

---

## 🏗️ Architecture

### Database Schema

#### `match_chains` Table

Stores multi-party swap proposals with scoring and explainability.

```sql
CREATE TABLE match_chains (
  id UUID PRIMARY KEY,
  chain_type VARCHAR(20), -- 'direct', 'triple', 'multi'
  participant_count INTEGER,
  object_ids UUID[],      -- All objects in chain
  user_ids UUID[],        -- All users in chain
  
  -- Composite Scoring (0-100)
  similarity_score DECIMAL(5,2),
  proximity_score DECIMAL(5,2),
  reputation_score DECIMAL(5,2),
  rarity_score DECIMAL(5,2),
  total_score DECIMAL(5,2),
  confidence DECIMAL(3,2),
  
  -- Constraints
  constraints_met JSONB,
  constraints_failed JSONB,
  
  -- Explainability
  match_reasons TEXT[],
  warnings TEXT[],
  
  -- Metadata
  estimated_cost_eur DECIMAL(8,2),
  estimated_duration_days INTEGER,
  co2_emissions_kg DECIMAL(8,2),
  
  -- Status
  status VARCHAR(20), -- 'proposed', 'accepted', 'in_progress', 'completed', 'cancelled'
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_algorithm VARCHAR(50) DEFAULT 'enhanced_v1'
);
```

#### `matching_constraints` Table

User preferences for match filtering.

```sql
CREATE TABLE matching_constraints (
  user_id UUID PRIMARY KEY,
  
  -- Distance Constraints
  max_distance_km INTEGER DEFAULT 500,
  prefer_local BOOLEAN DEFAULT TRUE,
  
  -- Value Constraints
  min_value_ratio DECIMAL(3,2) DEFAULT 0.7,
  max_value_ratio DECIMAL(3,2) DEFAULT 1.5,
  allow_credit_swaply BOOLEAN DEFAULT TRUE,
  
  -- Reputation Constraints
  min_trust_score INTEGER DEFAULT 50,
  require_verified_identity BOOLEAN DEFAULT FALSE,
  require_verified_address BOOLEAN DEFAULT FALSE,
  
  -- Category Constraints
  preferred_categories UUID[],
  excluded_categories UUID[],
  allow_cross_category BOOLEAN DEFAULT TRUE,
  
  -- Logistics Constraints
  max_shipping_cost_eur DECIMAL(8,2) DEFAULT 100,
  max_swap_duration_days INTEGER DEFAULT 14,
  require_insurance BOOLEAN DEFAULT FALSE,
  
  -- Multi-Party Constraints
  allow_chain_swaps BOOLEAN DEFAULT TRUE,
  max_chain_length INTEGER DEFAULT 3
);
```

#### `match_feedback` Table

Learning from user interactions.

```sql
CREATE TABLE match_feedback (
  id UUID PRIMARY KEY,
  match_chain_id UUID REFERENCES match_chains(id),
  user_id UUID REFERENCES users(id),
  object_id UUID REFERENCES objects(id),
  
  action VARCHAR(20), -- 'view', 'like', 'skip', 'accept', 'reject', 'complete'
  feedback_reason VARCHAR(100),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  time_spent_seconds INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎯 Composite Scoring System

The algorithm uses **4 weighted components** to calculate match quality:

### Formula

```
Total Score = (Similarity × 40%) + (Proximity × 25%) + (Reputation × 25%) + (Rarity × 10%)
```

### 1. Similarity Score (40% weight)

Measures category and keyword compatibility.

**Algorithm:**
- Same leaf category: **50 points**
- Same parent category: **30 points**
- Different category tree: **10 points**
- Keyword overlap: **+5 points per match** (max 50 points)

**Example:**
```
Object A: "iPhone 12, smartphone, electronics"
Object B: "Samsung S21, phone, electronics"

Category match: Same parent (smartphones) = 30 points
Keywords: "smartphone"/"phone" match = 5 points
Total Similarity = 35 points
```

### 2. Proximity Score (25% weight)

Measures geographic distance using Haversine formula.

**Distance Brackets:**
- **<50 km**: 100 points (local)
- **50-100 km**: 90 points (nearby)
- **100-200 km**: 70 points (regional)
- **200-500 km**: 40 points (distant)
- **>500 km**: 10 points (very far)

**Example:**
```
User A (București) ↔ User B (Ploiești): ~60 km = 90 points
User A (București) ↔ User C (Cluj): ~440 km = 40 points
```

### 3. Reputation Score (25% weight)

Averages TrustScore of all participants.

**Algorithm:**
```
Reputation Score = AVG(user1.trust_score, user2.trust_score, ...)
```

**Example:**
```
User A: TrustScore 85
User B: TrustScore 72
User C: TrustScore 68

Reputation Score = (85 + 72 + 68) / 3 = 75 points
```

### 4. Rarity Score (10% weight)

Rewards matches with rare items (inverse popularity).

**Category Popularity:**
- **Rare** (<10 objects): 90 points
- **Uncommon** (10-100): 70 points
- **Common** (100-1000): 50 points
- **Popular** (>1000): 20 points

**Example:**
```
Object in "Vinyl Records" category: 35 objects = 70 points
Object in "Smartphones" category: 1500 objects = 20 points
Average Rarity = (70 + 20) / 2 = 45 points
```

### Complete Example

```
Match: iPhone 12 (București) ↔ Samsung S21 (Ploiești)

Similarity: 35 points × 40% = 14.0
Proximity: 90 points × 25% = 22.5
Reputation: 75 points × 25% = 18.75
Rarity: 45 points × 10% = 4.5

TOTAL SCORE = 59.75 (Good Match)
```

---

## 🔗 Chain Detection Algorithms

### Direct Matching (A↔B)

**Algorithm:**
1. Get source object's category and keywords
2. Query objects in same/parent categories
3. Calculate 4 scoring components
4. Compute composite score
5. Filter by minimum threshold (40 points)
6. Return top matches ordered by score

**SQL Function:**
```sql
SELECT * FROM find_direct_matches(
  p_object_id := 'uuid-of-my-object',
  p_limit := 20
);
```

**TypeScript Usage:**
```typescript
import { findDirectMatches } from '@/lib/matching/chain-solver';

const matches = await findDirectMatches(objectId, 20);

matches.forEach(match => {
  console.log(`Match: ${match.object_id}`);
  console.log(`Score: ${match.total_score}%`);
  console.log(`Reasons: ${match.match_reasons.join(', ')}`);
});
```

### Triple Chain Matching (A→B→C→A)

**Algorithm:**
1. **Step 1**: Find objects that want A (A→B candidates)
2. **Step 2**: For each B, find objects that B wants (B→C candidates)
3. **Step 3**: Check if C wants A (complete the loop C→A)
4. Validate all constraints
5. Calculate composite score (simplified for chains)
6. Return valid triple chains

**SQL Function:**
```sql
SELECT * FROM find_triple_chain_matches(
  p_object_id := 'uuid-of-my-object',
  p_limit := 10
);
```

**TypeScript Usage:**
```typescript
import { findTripleChainMatches } from '@/lib/matching/chain-solver';

const chains = await findTripleChainMatches(objectId, 10);

chains.forEach(chain => {
  console.log(`Chain: ${chain.object_ids.join(' → ')}`);
  console.log(`Participants: ${chain.user_ids.length}`);
  console.log(`Score: ${chain.total_score}%`);
});
```

**Graph Visualization:**
```
Direct Match:        A ←→ B

Triple Chain:        A → B
                     ↑   ↓
                     C ← C

Multi-Party (future): A → B → C → D
                      ↑           ↓
                      F ← E ← ← ← ←
```

---

## 🔒 Constraint Solver

The system validates matches against user preferences before showing them.

### Constraint Types

#### Distance Constraint
```sql
distance_km <= user.max_distance_km
```

#### Value Constraint
```sql
min_value_ratio <= (object_value / partner_object_value) <= max_value_ratio
```

#### Reputation Constraint
```sql
partner.trust_score >= user.min_trust_score
```

#### Category Constraint
```sql
object.category_id NOT IN user.excluded_categories
AND (allow_cross_category OR same_category_tree)
```

### Checking Constraints

**SQL Function:**
```sql
SELECT * FROM check_match_constraints(
  p_user_id := 'user-uuid',
  p_partner_id := 'partner-uuid',
  p_distance_km := 120.5,
  p_value_ratio := 0.85
);

-- Returns:
{
  "satisfied": ["distance_acceptable", "value_ratio_ok", "reputation_sufficient"],
  "failed": []
}
```

**TypeScript Usage:**
```typescript
import { checkMatchConstraints } from '@/lib/matching/chain-solver';

const result = await checkMatchConstraints(
  userId,
  partnerId,
  120.5, // distance in km
  0.85   // value ratio
);

if (result.failed.length > 0) {
  console.log('⚠️ Constraints failed:', result.failed);
} else {
  console.log('✅ All constraints satisfied');
}
```

---

## 📚 TypeScript Library API

### Match Discovery

#### `findDirectMatches(objectId, limit)`
Find direct A↔B swap matches.

```typescript
const matches = await findDirectMatches('object-uuid', 20);
```

#### `getRecommendedMatches(objectId, userId, limit)`
Get matches filtered by user constraints.

```typescript
const matches = await getRecommendedMatches('object-uuid', 'user-uuid', 20);
```

#### `findTripleChainMatches(objectId, limit)`
Find A→B→C→A chain matches.

```typescript
const chains = await findTripleChainMatches('object-uuid', 10);
```

#### `getAllMatches(objectId, userId, includeChains)`
Get both direct and chain matches.

```typescript
const { direct, chains } = await getAllMatches('object-uuid', 'user-uuid', true);
```

### Constraint Management

#### `getMatchingConstraints(userId)`
Retrieve user's matching preferences.

```typescript
const constraints = await getMatchingConstraints('user-uuid');
console.log(`Max distance: ${constraints.max_distance_km} km`);
```

#### `upsertMatchingConstraints(constraints)`
Create or update constraints.

```typescript
await upsertMatchingConstraints({
  user_id: 'user-uuid',
  max_distance_km: 200,
  min_trust_score: 70,
  allow_chain_swaps: true
});
```

#### `getDefaultConstraints(userId)`
Get default constraint values.

```typescript
const defaults = getDefaultConstraints('user-uuid');
```

### Match Chain Operations

#### `createMatchChain(chain)`
Create a match proposal.

```typescript
const chain = await createMatchChain({
  chain_type: 'direct',
  object_ids: [objectA, objectB],
  user_ids: [userA, userB],
  total_score: 75.5,
  match_reasons: ['High similarity', 'Nearby location']
});
```

#### `getMatchChain(chainId)`
Retrieve match chain details.

```typescript
const chain = await getMatchChain('chain-uuid');
```

#### `getUserMatchChains(userId, status?)`
Get user's match history.

```typescript
const activeChains = await getUserMatchChains('user-uuid', 'proposed');
const completed = await getUserMatchChains('user-uuid', 'completed');
```

#### `acceptMatchChain(chainId)`
Accept a match proposal.

```typescript
await acceptMatchChain('chain-uuid');
```

#### `rejectMatchChain(chainId)`
Reject a match proposal.

```typescript
await rejectMatchChain('chain-uuid');
```

### Feedback & Learning

#### `recordMatchFeedback(feedback)`
Record user interaction.

```typescript
await recordMatchFeedback({
  match_chain_id: 'chain-uuid',
  user_id: 'user-uuid',
  object_id: 'object-uuid',
  action: 'like',
  rating: 5
});
```

#### `trackMatchView(matchChainId, userId, objectId, timeSpent)`
Track implicit feedback.

```typescript
await trackMatchView('chain-uuid', 'user-uuid', 'object-uuid', 45);
```

#### `likeMatch(matchChainId, userId, objectId)`
Positive feedback shortcut.

```typescript
await likeMatch('chain-uuid', 'user-uuid', 'object-uuid');
```

#### `skipMatch(matchChainId, userId, objectId, reason?)`
Negative feedback shortcut.

```typescript
await skipMatch('chain-uuid', 'user-uuid', 'object-uuid', 'Too far away');
```

### Utilities

#### `getScoreInterpretation(score)`
Get human-readable score description.

```typescript
const interpretation = getScoreInterpretation(75);
// {
//   label: 'Good Match',
//   color: '#3B82F6',
//   description: 'Good compatibility, worth considering'
// }
```

#### `formatMatchReasons(reasons)`
Localize match reasons.

```typescript
const localized = formatMatchReasons([
  'High similarity',
  'Nearby location'
]);
// ['🎯 Categorii foarte similare', '📍 Locație apropiată']
```

---

## 💡 Usage Examples

### Example 1: Show Direct Matches on Object Page

```typescript
import { getRecommendedMatches, getScoreInterpretation } from '@/lib/matching/chain-solver';

export default async function ObjectPage({ params }: { params: { id: string } }) {
  const matches = await getRecommendedMatches(params.id, currentUserId, 10);
  
  return (
    <div>
      <h2>Compatible Swaps</h2>
      {matches.map(match => {
        const interpretation = getScoreInterpretation(match.total_score);
        
        return (
          <div key={match.object_id} className="match-card">
            <h3>{match.object_title}</h3>
            <div style={{ color: interpretation.color }}>
              {interpretation.label} ({match.total_score}%)
            </div>
            <ul>
              {match.match_reasons.map(reason => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
```

### Example 2: Show Chain Matches

```typescript
import { findTripleChainMatches } from '@/lib/matching/chain-solver';

async function showChainMatches(objectId: string) {
  const chains = await findTripleChainMatches(objectId, 5);
  
  chains.forEach(chain => {
    console.log(`🔗 Chain Match Found!`);
    console.log(`Path: ${chain.object_ids.join(' → ')}`);
    console.log(`Score: ${chain.total_score}%`);
    console.log(`Why: ${chain.match_reasons.join(', ')}`);
  });
}
```

### Example 3: Configure User Preferences

```typescript
import { upsertMatchingConstraints } from '@/lib/matching/chain-solver';

async function savePreferences(userId: string) {
  await upsertMatchingConstraints({
    user_id: userId,
    max_distance_km: 100,      // Only show local matches
    prefer_local: true,
    min_trust_score: 75,       // Higher reputation users
    allow_chain_swaps: false,  // Direct swaps only
    excluded_categories: [      // Never show these
      'category-uuid-1',
      'category-uuid-2'
    ]
  });
}
```

### Example 4: Create Match Proposal

```typescript
import { createMatchChain } from '@/lib/matching/chain-solver';

async function proposeSwap(myObjectId: string, theirObjectId: string) {
  const chain = await createMatchChain({
    chain_type: 'direct',
    participant_count: 2,
    object_ids: [myObjectId, theirObjectId],
    user_ids: [myUserId, theirUserId],
    similarity_score: 75.0,
    proximity_score: 90.0,
    reputation_score: 80.0,
    rarity_score: 60.0,
    total_score: 78.5,
    confidence: 0.85,
    match_reasons: [
      'High similarity',
      'Nearby location',
      'Excellent reputation'
    ]
  });
  
  console.log(`✅ Match proposal created: ${chain.id}`);
}
```

### Example 5: Handle Match Response

```typescript
import { acceptMatchChain, rejectMatchChain, recordMatchFeedback } from '@/lib/matching/chain-solver';

async function handleMatchResponse(chainId: string, accepted: boolean) {
  if (accepted) {
    await acceptMatchChain(chainId);
    await recordMatchFeedback({
      match_chain_id: chainId,
      user_id: currentUserId,
      object_id: myObjectId,
      action: 'accept',
      rating: 5,
      feedback_reason: 'Perfect match!'
    });
  } else {
    await rejectMatchChain(chainId);
    await recordMatchFeedback({
      match_chain_id: chainId,
      user_id: currentUserId,
      object_id: myObjectId,
      action: 'reject',
      rating: 2,
      feedback_reason: 'Too far away'
    });
  }
}
```

---

## 🔌 Integration Guide

### Step 1: Add to Object Detail Page

```typescript
// src/app/obiecte/[id]/page.tsx

import { getRecommendedMatches } from '@/lib/matching/chain-solver';
import MatchList from '@/components/MatchList';

export default async function ObjectDetailPage({ params }) {
  const { user } = await getServerSupabase();
  const matches = await getRecommendedMatches(params.id, user.id, 20);
  
  return (
    <>
      <ObjectDetails />
      <MatchList matches={matches} />
    </>
  );
}
```

### Step 2: Create Match List Component

```typescript
// src/components/MatchList.tsx

'use client';

import { DirectMatch } from '@/lib/matching/chain-solver';
import { getScoreInterpretation, formatMatchReasons } from '@/lib/matching/chain-solver';

export default function MatchList({ matches }: { matches: DirectMatch[] }) {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold">Compatible Swaps</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {matches.map(match => {
          const interpretation = getScoreInterpretation(match.total_score);
          const reasons = formatMatchReasons(match.match_reasons);
          
          return (
            <div key={match.object_id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold">Object Title</h3>
                <span style={{ color: interpretation.color }}>
                  {match.total_score}%
                </span>
              </div>
              
              <div className="mt-2 text-sm text-gray-600">
                {interpretation.label}
              </div>
              
              <ul className="mt-2 space-y-1 text-sm">
                {reasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
              
              <button className="mt-4 w-full bg-blue-500 text-white py-2 rounded">
                Propose Swap
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### Step 3: Add Preferences Page

```typescript
// src/app/setari/potriviri/page.tsx

import { getMatchingConstraints, upsertMatchingConstraints } from '@/lib/matching/chain-solver';
import PreferencesForm from '@/components/PreferencesForm';

export default async function MatchPreferencesPage() {
  const { user } = await getServerSupabase();
  const constraints = await getMatchingConstraints(user.id);
  
  return (
    <div>
      <h1>Match Preferences</h1>
      <PreferencesForm initialConstraints={constraints} />
    </div>
  );
}
```

---

## 🧪 Testing

### SQL Function Tests

```sql
-- Test 1: Direct Matching
SELECT * FROM find_direct_matches(
  p_object_id := 'test-object-uuid',
  p_limit := 10
);

-- Test 2: Triple Chain Matching
SELECT * FROM find_triple_chain_matches(
  p_object_id := 'test-object-uuid',
  p_limit := 5
);

-- Test 3: Constraint Checking
SELECT * FROM check_match_constraints(
  p_user_id := 'user-uuid',
  p_partner_id := 'partner-uuid',
  p_distance_km := 150.0,
  p_value_ratio := 0.9
);

-- Test 4: Scoring Components
SELECT 
  calculate_similarity_score('obj1', 'obj2') as similarity,
  calculate_proximity_score('user1', 'user2') as proximity,
  calculate_reputation_score(ARRAY['user1', 'user2']) as reputation,
  calculate_rarity_score(ARRAY['obj1', 'obj2']) as rarity;
```

### TypeScript Unit Tests

```typescript
import { 
  findDirectMatches, 
  findTripleChainMatches,
  getScoreInterpretation 
} from '@/lib/matching/chain-solver';

describe('Chain Matching', () => {
  test('finds direct matches', async () => {
    const matches = await findDirectMatches('test-object-id', 10);
    expect(matches).toBeInstanceOf(Array);
    expect(matches[0]).toHaveProperty('total_score');
  });
  
  test('finds triple chains', async () => {
    const chains = await findTripleChainMatches('test-object-id', 5);
    expect(chains).toBeInstanceOf(Array);
    expect(chains[0].object_ids).toHaveLength(3);
  });
  
  test('interprets scores correctly', () => {
    expect(getScoreInterpretation(85).label).toBe('Excellent Match');
    expect(getScoreInterpretation(65).label).toBe('Good Match');
    expect(getScoreInterpretation(45).label).toBe('Fair Match');
    expect(getScoreInterpretation(25).label).toBe('Weak Match');
  });
});
```

---

## ⚡ Performance

### Database Optimization

- **GIN Indexes** on array columns (`object_ids`, `user_ids`) for fast containment queries
- **B-tree Indexes** on `status`, `total_score DESC`, `expires_at`
- **Composite Index** on `(created_at DESC, status)` for feed queries
- **Function Optimization**: All scoring functions are `IMMUTABLE` for caching

### Query Performance

```sql
-- Explain analyze for direct matching
EXPLAIN ANALYZE
SELECT * FROM find_direct_matches('test-uuid', 20);

-- Expected: <100ms for databases with 100K objects
```

### Caching Strategy

```typescript
// Client-side cache for match results (5 minutes TTL)
const MATCH_CACHE_TTL = 5 * 60 * 1000;
const matchCache = new Map();

export async function getCachedMatches(objectId: string) {
  const cached = matchCache.get(objectId);
  if (cached && Date.now() - cached.timestamp < MATCH_CACHE_TTL) {
    return cached.data;
  }
  
  const matches = await findDirectMatches(objectId);
  matchCache.set(objectId, {
    data: matches,
    timestamp: Date.now()
  });
  
  return matches;
}
```

---

## 🚀 Future Enhancements

### N-Party Chains (4+ participants)

```sql
-- Future: find_multi_chain_matches()
-- Support chains like A→B→C→D→E→A
CREATE FUNCTION find_multi_chain_matches(
  p_object_id UUID,
  p_max_length INTEGER DEFAULT 5,
  p_limit INTEGER DEFAULT 5
) RETURNS TABLE(...);
```

### Machine Learning Scoring

```python
# Train ML model on match_feedback data
# Predict optimal weights for scoring components

import pandas as pd
from sklearn.ensemble import RandomForestRegressor

feedback = pd.read_sql('SELECT * FROM match_feedback', conn)
model = RandomForestRegressor()
model.fit(X_features, y_success_rate)

# Generate personalized weights per user
user_weights = model.predict(user_features)
```

### Real-Time Notifications

```typescript
// Subscribe to new match chains
const supabase = createClient();

supabase
  .channel('match_chains')
  .on('postgres_changes', 
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'match_chains',
      filter: `user_ids=cs.{${userId}}`
    },
    (payload) => {
      showNotification(`New match found! Score: ${payload.new.total_score}%`);
    }
  )
  .subscribe();
```

### Geographic Clustering

```sql
-- Use PostGIS for efficient proximity queries
CREATE INDEX idx_users_location ON users USING GIST(location);

SELECT * FROM users
WHERE ST_DWithin(
  location,
  ST_MakePoint(44.4268, 26.1025),
  50000 -- 50km radius in meters
);
```

---

## 🐛 Troubleshooting

### No Matches Found

**Problem**: `findDirectMatches()` returns empty array.

**Solutions**:
1. Check if source object has `category_id` set
2. Verify there are objects in same/parent categories
3. Lower minimum threshold (currently 40 points)
4. Check user constraints aren't too restrictive

```typescript
// Debug: Get all potential matches without filtering
const allMatches = await findDirectMatches(objectId, 100);
console.log(`Found ${allMatches.length} total matches`);

// Check constraints
const constraints = await getMatchingConstraints(userId);
console.log('Active constraints:', constraints);
```

### Low Match Scores

**Problem**: All matches have scores below 50.

**Possible Causes**:
- Users are geographically far apart (low proximity score)
- Objects are in different category trees (low similarity)
- No keyword overlap (low similarity bonus)
- All participants have low reputation

**Solutions**:
1. Encourage users to set location accurately
2. Add more keywords to object descriptions
3. Expand matching to parent categories
4. Adjust score weights for your use case

```sql
-- Debug: Check individual score components
SELECT 
  object_id,
  similarity_score,
  proximity_score,
  reputation_score,
  rarity_score,
  total_score
FROM find_direct_matches('test-uuid', 10);
```

### Constraint Failures

**Problem**: Matches exist but are filtered out by constraints.

**Debug Query**:
```sql
SELECT 
  c.constraints_met,
  c.constraints_failed
FROM match_chains c
WHERE 'user-uuid' = ANY(c.user_ids)
ORDER BY created_at DESC
LIMIT 10;
```

**Common Issues**:
- `distance_too_far`: Increase `max_distance_km`
- `low_reputation`: Lower `min_trust_score`
- `value_mismatch`: Widen `min/max_value_ratio` range

### Performance Issues

**Problem**: Queries take >1 second.

**Diagnostics**:
```sql
-- Check index usage
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM find_direct_matches('test-uuid', 20);

-- Rebuild indexes if needed
REINDEX TABLE match_chains;
REINDEX TABLE matching_constraints;

-- Update statistics
ANALYZE objects;
ANALYZE users;
```

---

## 📊 Analytics Queries

### Match Success Rate

```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*) as success_rate_pct
FROM match_chains
WHERE created_at > NOW() - INTERVAL '30 days';
```

### Average Match Scores

```sql
SELECT 
  chain_type,
  AVG(total_score) as avg_score,
  AVG(similarity_score) as avg_similarity,
  AVG(proximity_score) as avg_proximity
FROM match_chains
WHERE status != 'cancelled'
GROUP BY chain_type;
```

### Most Common Constraints

```sql
SELECT 
  AVG(max_distance_km) as avg_max_distance,
  AVG(min_trust_score) as avg_min_trust,
  COUNT(*) FILTER (WHERE allow_chain_swaps) * 100.0 / COUNT(*) as chain_enabled_pct
FROM matching_constraints;
```

### User Feedback Analysis

```sql
SELECT 
  action,
  COUNT(*) as count,
  AVG(rating) as avg_rating,
  AVG(time_spent_seconds) as avg_time_spent
FROM match_feedback
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY action
ORDER BY count DESC;
```

---

## 📖 Related Documentation

- [AI Taxonomy Foundation](./AI_TAXONOMY.md) - International product classification
- [Supabase Setup](./SETUP_SUPABASE.md) - Database configuration
- [Rating System](./RATING_SYSTEM.md) - TrustScore calculation
- [Distance Search](./DISTANCE_SEARCH.md) - Geographic queries

---

## 🤝 Contributing

This system is designed to be extensible. To add new features:

1. **New Scoring Components**: Add function in migration, update composite score weights
2. **New Constraints**: Add column to `matching_constraints`, update checking logic
3. **New Chain Types**: Add to `chain_type` enum, implement detection algorithm
4. **New Feedback Actions**: Add to `action` enum, update learning system

---

## 📝 License

Part of Swaply platform. All rights reserved.

---

**Last Updated**: 2025-01-08  
**Migration**: `015_chain_matching.sql`  
**Library**: `src/lib/matching/chain-solver.ts`
