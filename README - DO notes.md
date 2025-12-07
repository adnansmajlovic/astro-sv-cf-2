# Durable Object Implementation Notes

## Overview

This document contains important notes about the UserTracker Durable Object implementation using SQLite for permanent user analytics storage.

## Architecture

### Database Schema

The Durable Object uses SQLite with two main tables:

#### Sessions Table

```sql
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    sessionId TEXT UNIQUE NOT NULL,
    startTime INTEGER NOT NULL,
    lastActivity INTEGER NOT NULL,
    deviceInfo TEXT DEFAULT '{}'
);
```

#### Movements Table (Permanent Storage)

```sql
CREATE TABLE movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    sessionId TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    event TEXT NOT NULL,
    data TEXT DEFAULT '{}'
);
```

### Performance Indexes

- `idx_sessions_userId` - Fast user session lookups
- `idx_sessions_startTime` - Time-based session filtering
- `idx_movements_userId` - Fast user movement lookups
- `idx_movements_timestamp` - Time-based movement filtering
- `idx_movements_sessionId` - Session-based movement lookups

## Key Implementation Details

### Data Persistence Strategy

- **Sessions**: Temporary containers, cleaned up after 30 minutes of inactivity
- **Movements**: Permanent storage, never deleted automatically
- **Time Range Filtering**: Uses SQL WHERE clauses for efficient filtering

### API Endpoints

1. **POST /track** - Store user movements (page views, clicks, etc.)
2. **POST /session** - Create/update user sessions
3. **GET /session?sessionId=xxx** - Retrieve session details
4. **GET /analytics?userId=xxx&timeRange=7d** - Get user analytics with time filtering

### Time Range Support

- `1h` - Last hour
- `24h` - Last 24 hours
- `7d` - Last 7 days
- `30d` - Last 30 days

### SQL Query Examples

#### Get User Page Views

```sql
SELECT * FROM movements
WHERE userId = ?1
AND timestamp >= ?2
AND event = 'page_view'
ORDER BY timestamp DESC;
```

#### Session Statistics

```sql
SELECT COUNT(*) as count FROM sessions
WHERE startTime >= ?1
AND userId = ?2;
```

## Configuration

### Wrangler Service Binding

```jsonc
"services": [
    {
        "binding": "USER_TRACKER_SERVICE",
        "service": "user-tracker-worker"
    }
]
```

### Environment Variables

- `USER_TRACKER_SERVICE` - Service binding to the user tracker worker

## Important Notes

### Development vs Production

- **Development**: Falls back to mock responses when USER_TRACKER_SERVICE is not available
- **Production**: Uses actual Durable Object service binding

### Error Handling

- All endpoints include proper error handling with meaningful error messages
- Database initialization errors are logged but don't crash the worker
- Failed operations return appropriate HTTP status codes

### Security Considerations

- CORS headers are properly configured
- Input validation for all endpoints
- SQL injection prevention through parameterized queries

### Performance Considerations

- Indexes on frequently queried columns
- Efficient SQL queries with proper WHERE clauses
- Cleanup of expired sessions (but not movements)
- Pagination support for large datasets

## File Structure

```
workers/user-tracker/
├── src/
│   ├── UserTracker.ts    # Main Durable Object implementation
│   └── index.ts          # Worker entry point
├── package.json
├── tsconfig.json
└── wrangler.jsonc

src/routes/(api)/api/track/
├── +server.ts           # Main tracking endpoint
├── session/+server.ts   # Session management
└── analytics/+server.ts # Analytics endpoint
```

## Usage Example

### Client-Side Tracking

```javascript
import { userTracker } from '$lib/tracking/client';

// Initialize with user ID
await userTracker.initialize('user-123');

// Track page view
await userTracker.trackPageView('/dashboard');

// Get analytics
const analytics = await userTracker.getAnalytics('7d');
```

### Server-Side Analytics

```javascript
// Get user analytics via API
const response = await fetch('/api/track/analytics?userId=user-123&timeRange=7d');
const analytics = await response.json();
```

## Monitoring and Debugging

### Logging

- All operations are logged with appropriate detail levels
- Database operations include error logging
- Session cleanup activities are logged

### Diagnostics

- Check USER_TRACKER_SERVICE binding availability
- Monitor database initialization success
- Track cleanup operation frequency

## Future Enhancements

### Potential Improvements

1. **Data Retention Policies**: Implement automatic cleanup of old movements
2. **Aggregation Tables**: Pre-computed analytics for better performance
3. **Batch Operations**: Support for bulk movement insertion
4. **Real-time Analytics**: WebSocket support for live user tracking
5. **Advanced Filtering**: Support for complex query conditions

### Scalability Considerations

- Consider partitioning movements table by time or user
- Implement data archiving for very old records
- Add support for multiple Durable Object instances

## Troubleshooting

### Common Issues

1. **Service binding not available**: Check wrangler.jsonc configuration
2. **Database initialization fails**: Check SQL syntax and permissions
3. **Time range filtering not working**: Verify timestamp format and timezone handling
4. **Session cleanup not running**: Check alarm scheduling and execution

### Debug Commands

```bash
# Check worker logs
wrangler tail user-tracker-worker

# Inspect Durable Object state
wrangler dev --compatibility-date 2025-01-01
```

---

**Last Updated**: July 2025
**Author**: a.s.
**Version**: 1.0
