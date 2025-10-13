# Google Analytics 4 Integration Guide

## Overview

Google Analytics 4 (GA4) tracking has been integrated into Swaply to monitor user behavior, track conversions, and analyze performance metrics.

## Setup Instructions

### 1. Create Google Analytics Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click **Admin** (gear icon in bottom left)
3. Create a new **Property**
4. Select **Web** as platform
5. Enter your website details:
   - **Website URL**: `https://swaply.vercel.app` (or your custom domain)
   - **Property Name**: "Swaply"
   - **Time Zone**: Europe/Bucharest
   - **Currency**: RON (Romanian Leu)
6. Complete setup wizard
7. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)

### 2. Add to Environment Variables

Add the Measurement ID to your `.env.local`:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. Deploy to Vercel

Add the environment variable in Vercel dashboard:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add:
   - **Key**: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - **Value**: `G-XXXXXXXXXX`
   - **Environment**: Production, Preview, Development
3. **Redeploy** your application

### 4. Verify Installation

1. Visit your website
2. Open Chrome DevTools → **Network** tab
3. Filter by "gtag" or "google-analytics"
4. You should see requests to `www.google-analytics.com`
5. Check **Real-Time** reports in Google Analytics dashboard

## Files Created

### `src/lib/analytics/index.ts`
Main analytics library with:
- `trackEvent()` - Track custom events
- `trackPageView()` - Track page views
- `analytics.*` - Convenience functions for common events

### `src/components/GoogleAnalytics.tsx`
Client component that:
- Loads Google Analytics script
- Tracks route changes automatically
- Handles Next.js App Router navigation

## Events Tracked

### Authentication Events
- `signup` - User registration (email/google/magic_link)
- `login` - User login
- `logout` - User logout
- `2fa_enabled` - Two-factor authentication enabled
- `2fa_disabled` - Two-factor authentication disabled

### Object Events
- `object_created` - New object posted
- `object_edited` - Object details updated
- `object_deleted` - Object removed

### Swap Events
- `swap_request_sent` - Swap proposal sent
- `swap_request_accepted` - Swap accepted
- `swap_request_rejected` - Swap rejected
- `swap_completed` - Swap finalized

### Engagement Events
- `match_found` - AI matching algorithm found a match
- `chat_message_sent` - Message sent in chat
- `search_performed` - Search query executed
- `filter_applied` - Search filter used
- `rating_submitted` - Review posted
- `notification_clicked` - Notification interacted with

### Gamification Events
- `badge_earned` - Achievement unlocked
- `level_up` - User leveled up

### Page Views
- Automatic tracking on all route changes
- Query parameters included

## Usage Examples

### Track Object Creation

```typescript
import { analytics } from '@/lib/analytics';

// In your object creation handler
const handleCreateObject = async (data) => {
  const newObject = await createObject(data);
  
  // Track the event
  analytics.trackObjectCreated(newObject.id, newObject.category);
};
```

### Track Swap Request

```typescript
import { analytics } from '@/lib/analytics';

const handleSwapRequest = async (objectId) => {
  const swap = await createSwapRequest(objectId);
  
  analytics.trackSwapRequest(swap.id, objectCategory);
};
```

### Track Search

```typescript
import { analytics } from '@/lib/analytics';

const handleSearch = async (query: string) => {
  const results = await searchObjects(query);
  
  analytics.trackSearch(query, results.length);
};
```

### Track Custom Event

```typescript
import { trackEvent } from '@/lib/analytics';

trackEvent('custom_event_name', {
  category: 'category_name',
  label: 'event_label',
  value: 123,
  custom_param: 'custom_value'
});
```

## Integration Points

### Already Integrated (Ready to Use)

Once you add the `NEXT_PUBLIC_GA_MEASUREMENT_ID`, tracking will work automatically for:
- ✅ Page views (all routes)
- ✅ Route changes (Next.js navigation)

### Needs Manual Integration

Add these tracking calls to your existing components:

#### 1. Object Creation (`src/app/obiecte/nou/actions.ts`)

```typescript
import { analytics } from '@/lib/analytics';

// After successful object creation
analytics.trackObjectCreated(objectId, category);
```

#### 2. Swap Requests (`src/components/SwapRequestButton.tsx` or similar)

```typescript
import { analytics } from '@/lib/analytics';

// After sending swap request
analytics.trackSwapRequest(swapId, objectCategory);
```

#### 3. Swap Completion

```typescript
import { analytics } from '@/lib/analytics';

// When swap is marked as completed
analytics.trackSwapCompleted(swapId);
```

#### 4. Search (`src/app/cauta/page.tsx`)

```typescript
import { analytics } from '@/lib/analytics';

// After search executes
analytics.trackSearch(searchQuery, resultsCount);

// When filter is applied
analytics.trackFilter('category', selectedCategory);
```

#### 5. Rating Submission (`src/components/RatingModal.tsx`)

```typescript
import { analytics } from '@/lib/analytics';

// After rating is submitted
analytics.trackRating(swapId, rating);
```

#### 6. Authentication (`src/app/(auth)/login/actions.ts`)

```typescript
import { analytics } from '@/lib/analytics';

// After successful login
analytics.trackLogin('email'); // or 'google', 'magic_link'

// After signup
analytics.trackSignup('email');
```

#### 7. Gamification

```typescript
import { analytics } from '@/lib/analytics';

// When badge is earned
analytics.trackBadgeEarned(badgeId, badgeName);

// When user levels up
analytics.trackLevelUp(newLevel);
```

#### 8. 2FA (`src/app/securitate/page.tsx`)

```typescript
import { analytics } from '@/lib/analytics';

// When 2FA is enabled
analytics.track2FAEnabled();

// When 2FA is disabled
analytics.track2FADisabled();
```

## Privacy & Compliance

### GDPR Compliance

The implementation includes privacy features:
- ✅ **IP Anonymization**: Enabled by default (`anonymize_ip: true`)
- ✅ **Cookie Flags**: Secure and SameSite flags set
- ✅ **Optional Loading**: Only loads when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set

### Cookie Consent (Recommended)

For full GDPR compliance, add cookie consent banner:

```bash
npm install react-cookie-consent
```

```typescript
import CookieConsent from 'react-cookie-consent';

// In app/layout.tsx
<CookieConsent
  location="bottom"
  buttonText="Accept"
  declineButtonText="Decline"
  enableDeclineButton
  onAccept={() => {
    // Load Google Analytics
  }}
>
  This website uses cookies to enhance the user experience.
</CookieConsent>
```

## Reports & Dashboards

### Recommended GA4 Reports

1. **Realtime Overview**
   - Active users now
   - Top pages
   - Traffic sources

2. **Engagement**
   - Events by event name
   - User engagement metrics
   - Session duration

3. **Conversions**
   - Set up conversion events:
     - `object_created`
     - `swap_completed`
     - `signup`
   - Track conversion funnel

4. **User Acquisition**
   - New vs returning users
   - Traffic sources
   - Campaign performance

5. **Custom Reports**
   - Create custom report for swap flow:
     - `swap_request_sent` → `swap_request_accepted` → `swap_completed`
   - Gamification engagement:
     - `badge_earned`, `level_up` counts

### Exploration Templates

#### Swap Funnel Analysis

```
Events in order:
1. page_view (object detail page)
2. swap_request_sent
3. swap_request_accepted
4. swap_completed
5. rating_submitted
```

#### Search Effectiveness

```
Dimensions:
- search_term
- filter applied

Metrics:
- search_performed count
- Click-through rate to object details
```

## Troubleshooting

### Events Not Showing Up

1. **Check Measurement ID**: Verify `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set correctly
2. **Check Network**: Open DevTools → Network, filter by "google-analytics"
3. **Check Real-Time Reports**: GA4 real-time shows events within seconds
4. **Development Mode**: Events are logged to console in development

### Page Views Not Tracked

1. Verify `GoogleAnalytics` component is in `app/layout.tsx`
2. Check browser console for errors
3. Disable ad blockers (they block GA scripts)

### Custom Events Not Working

```typescript
// Add debug logging
import { trackEvent } from '@/lib/analytics';

trackEvent('my_event', { category: 'test' });
console.log('Event tracked:', 'my_event');
```

Check console output and GA4 DebugView.

## Performance Considerations

- ✅ **`afterInteractive` strategy**: Scripts load after page is interactive
- ✅ **Minimal bundle impact**: Analytics code is ~2KB gzipped
- ✅ **No render blocking**: Scripts don't block initial page load
- ✅ **Tree-shakeable**: Unused functions removed in production

## Testing

### Development Testing

Events are logged to console when `NODE_ENV === 'development'`:

```
[Analytics] object_created { category: 'objects', object_id: '123', label: 'electronics' }
```

### Production Testing

1. Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` to production
2. Visit your website
3. Trigger events (create object, search, etc.)
4. Check **Real-Time** reports in GA4 dashboard
5. Events appear within 30 seconds

### Debug Mode

Enable GA4 debug mode in browser console:

```javascript
window.gtag('config', 'G-XXXXXXXXXX', { debug_mode: true });
```

Then check **DebugView** in GA4.

## Next Steps

1. ✅ **Add Measurement ID** to environment variables
2. ✅ **Deploy to Vercel** with new env var
3. ✅ **Verify installation** with Real-Time reports
4. 📋 **Integrate tracking calls** in your components (see "Needs Manual Integration" section)
5. 📊 **Set up custom reports** in GA4
6. 📈 **Configure conversion events** for key actions
7. 🍪 **Add cookie consent banner** (optional, for GDPR)

## Resources

- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/9304153)
- [GA4 Event Reference](https://support.google.com/analytics/answer/9267735)
- [Next.js Analytics Example](https://github.com/vercel/next.js/tree/canary/examples/with-google-analytics)
- [GDPR Compliance Guide](https://support.google.com/analytics/answer/9019185)

---

**Status**: ✅ Implemented, ready for configuration
**Estimated Setup Time**: 10 minutes
**Manual Integration Time**: 30-45 minutes
