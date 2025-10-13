# Rating & Review System

## Overview
Post-swap rating system allowing users to review each other after completed exchanges. Includes 1-5 star ratings, optional comments, and automatic average rating calculation.

## Database Schema

### `reviews` Table
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_request_id UUID NOT NULL REFERENCES swap_requests(id),
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  reviewee_id UUID NOT NULL REFERENCES auth.users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(swap_request_id, reviewer_id)
);
```

**Key Constraints:**
- Rating must be between 1 and 5
- One review per user per swap (UNIQUE constraint)
- Reviewer and reviewee cannot be the same person
- Swap must be completed before review

### Functions

#### `calculate_average_rating(p_user_id UUID)`
Calculates the average rating for a user from all received reviews.

#### `can_review_swap(p_swap_id UUID, p_reviewer_id UUID)`
Validates if a user can review a swap:
- Swap must be completed
- User must be a participant
- User hasn't already reviewed this swap

#### `trigger_update_rating_after_review()`
Auto-triggered on review insert:
- Updates reviewee's average_rating in user_levels
- Increments reviews_received count
- Increments reviewer's reviews_given count
- Awards +10 XP to reviewer
- Checks for new badges

## Components

### `RatingModal.tsx`
Modal dialog for submitting reviews.

**Props:**
```typescript
interface RatingModalProps {
  swapId: string;
  revieweeId: string;
  revieweeName: string;
  onClose: () => void;
  onSuccess?: () => void;
}
```

**Features:**
- Interactive 1-5 star selection with hover effects
- Star icons with fill animations
- Optional comment textarea (500 char limit)
- Rating labels: "Foarte slab" (1) → "Excelent!" (5)
- Client-side validation
- Server-side `can_review_swap` check
- Error and success states
- Bilingual support (Romanian/English)

**Usage:**
```tsx
import RatingModal from '@/components/RatingModal';

const [showRating, setShowRating] = useState(false);

{showRating && (
  <RatingModal
    swapId={swap.id}
    revieweeId={swap.other_user_id}
    revieweeName={swap.other_user_name}
    onClose={() => setShowRating(false)}
    onSuccess={() => {
      toast.success('Review trimis!');
      loadSwapDetails();
    }}
  />
)}
```

### `ReviewList.tsx`
Display list of reviews for a user.

**Props:**
```typescript
interface ReviewListProps {
  userId: string;
  limit?: number;      // Default: 5
  showAll?: boolean;   // Default: false
}
```

**Features:**
- Average rating calculation and display
- Total review count
- Star display component
- Reviewer avatar/initials
- Formatted dates (localized)
- Empty state with icon
- Loading spinner
- Hover effects on review cards

**Usage:**
```tsx
import ReviewList from '@/components/ReviewList';

// On profile page
<ReviewList userId={profile.id} limit={5} />

// Full reviews page
<ReviewList userId={profile.id} showAll />
```

## RLS Policies

### `reviews` Table Policies

1. **"Users can view reviews about them"**
   - Users can view reviews where they are reviewee or reviewer
   
2. **"Users can view their reviews"**
   - Users can view all reviews they wrote

3. **"Users can create reviews"**
   - User must be reviewer
   - Swap must be completed
   - User must be participant (requester or owner)
   - Reviewer cannot be reviewee

4. **"Users can update own reviews"**
   - Users can edit their own reviews

## Integration Points

### 1. Swap Completion Flow
```typescript
// After swap marked as completed
const handleSwapCompleted = async () => {
  // Mark swap as completed
  await supabase
    .from('swap_requests')
    .update({ status: 'completed' })
    .eq('id', swapId);
  
  // Show rating modal
  setShowRatingModal(true);
};
```

### 2. Profile Page
```tsx
// Display average rating and reviews
<div className="mb-6">
  <div className="flex items-center space-x-2 mb-4">
    <span className="text-3xl font-bold">
      {averageRating.toFixed(1)}
    </span>
    <StarDisplay rating={Math.round(averageRating)} />
    <span className="text-gray-600">
      ({totalReviews} reviews)
    </span>
  </div>
  
  <ReviewList userId={userId} limit={5} />
</div>
```

### 3. User Card/Preview
```tsx
// Show rating badge on user cards
<div className="flex items-center text-sm text-gray-600">
  <span className="text-yellow-500 mr-1">⭐</span>
  <span>{averageRating.toFixed(1)}</span>
  <span className="ml-1">({reviewCount})</span>
</div>
```

## XP & Gamification

**XP Rewards:**
- +10 XP for giving a review (REVIEW_GIVEN activity)

**Badge Opportunities:**
Reviews contribute to:
- Social badges (e.g., "Reviewer" badge for 10+ reviews given)
- Trust badges (e.g., "Trusted Swapper" for high average rating)

## API Examples

### Check if Can Review
```typescript
const { data: canReview } = await supabase
  .rpc('can_review_swap', {
    p_swap_id: swapId,
    p_reviewer_id: userId,
  });

if (!canReview) {
  alert('Cannot review this swap');
}
```

### Submit Review
```typescript
const { error } = await supabase
  .from('reviews')
  .insert([{
    swap_request_id: swapId,
    reviewer_id: currentUserId,
    reviewee_id: otherUserId,
    rating: 5,
    comment: 'Great swap experience!',
  }]);
```

### Get User's Average Rating
```typescript
const { data: avgRating } = await supabase
  .rpc('calculate_average_rating', { p_user_id: userId });

console.log(`Average: ${avgRating}/5`);
```

### Load User Reviews
```typescript
const { data: reviews, count } = await supabase
  .from('reviews')
  .select(`
    *,
    reviewer:reviewer_id (
      id,
      email,
      user_profiles (display_name, avatar_url)
    )
  `, { count: 'exact' })
  .eq('reviewee_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);
```

## UI/UX Best Practices

### When to Show Rating Modal
1. Immediately after swap completed
2. On swap details page if not yet reviewed
3. In notifications (reminder to review)

### Rating Scale Guidelines
- **1 star**: Very poor experience
- **2 stars**: Poor experience
- **3 stars**: OK experience
- **4 stars**: Good experience
- **5 stars**: Excellent experience

### Comment Etiquette (Display to Users)
- Be respectful and constructive
- Focus on the swap experience
- Don't include personal information
- Maximum 500 characters

## Testing Checklist

- [ ] Can submit rating after completed swap
- [ ] Cannot submit duplicate rating
- [ ] Cannot rate before swap completed
- [ ] Cannot rate own swaps
- [ ] Star selection works correctly
- [ ] Comment validation (500 char limit)
- [ ] Average rating updates correctly
- [ ] XP awarded on review submission
- [ ] Reviews display properly on profile
- [ ] Pagination works for many reviews
- [ ] Empty state displays correctly
- [ ] Error messages are clear
- [ ] Bilingual support works

## Migration Steps

1. Run database migration:
   ```bash
   psql -U postgres -d swaply -f database/migrations/005_rating_system.sql
   ```

2. Verify tables created:
   ```sql
   SELECT * FROM reviews LIMIT 0;
   ```

3. Test functions:
   ```sql
   SELECT calculate_average_rating('user-uuid-here');
   SELECT can_review_swap('swap-uuid', 'user-uuid');
   ```

4. Verify RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'reviews';
   ```

## Future Enhancements

- [ ] Response to reviews (allow reviewee to reply)
- [ ] Report inappropriate reviews
- [ ] Review editing with history
- [ ] Review verification badges
- [ ] Trending reviewers leaderboard
- [ ] Review reminders via notifications
- [ ] Photo attachments to reviews
- [ ] Review helpfulness voting (upvote/downvote)

## Troubleshooting

### "Cannot review this swap"
- Check swap status is 'completed'
- Verify user is participant
- Check for existing review

### Average rating not updating
- Verify trigger is installed
- Check user_levels table exists
- Run `calculate_average_rating()` manually

### Reviews not displaying
- Check RLS policies
- Verify user authentication
- Check join query for user_profiles

## Security Considerations

- ✅ RLS policies prevent viewing others' private data
- ✅ UNIQUE constraint prevents review spam
- ✅ CHECK constraint ensures valid ratings (1-5)
- ✅ Server-side validation in `can_review_swap()`
- ✅ Authenticated users only
- ✅ XSS protection via sanitized inputs
- ✅ Trigger functions prevent manual manipulation

## Performance Optimization

- Indexed columns: swap_request_id, reviewer_id, reviewee_id, rating
- Efficient average calculation with AVG() aggregate
- Pagination for large review lists
- COUNT query optimization with `count: 'exact'`
- Cached average rating in user_levels table

---

**Branch:** `feature/rating-system`  
**Status:** ✅ Complete  
**Deployment:** Vercel Preview Available
