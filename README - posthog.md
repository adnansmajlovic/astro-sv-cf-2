
How to query

📊 PostHog Dashboard Examples
Dashboard 1: App Usage

```sql
# Query 1: All pageviews by users with app "FAN"
Event: $pageview
Filter: has_app_FAN = true

# Query 2: Users with BOTH FAN and IGC
Event: $pageview
Filter: 
  - has_app_FAN = true
  - has_app_IGC = true

# Query 3: Breakdown by primary app
Event: $pageview
Breakdown by: app (group)

# Query 4: See all apps a user has
Event: $pageview
Show property: all_apps
```

Dashboard 2: App-Specific Behavior

```ini
1. FAN Users - Top Pages
   - Event: $pageview
   - Filter: has_app_FAN = true
   - Breakdown by: path

2. IGC Users - Feature Usage
   - Event: feature_used
   - Filter: has_app_IGC = true
   - Breakdown by: feature_name

3. Cross-App Comparison
   - Event: $pageview
   - Filters:
     - has_app_FAN = true (Series 1)
     - has_app_IGC = true (Series 2)
```
