---
status: complete
phase: 07-richer-weather-milestone-verification
source: [07-VERIFICATION.md]
started: 2026-07-09T00:00:00Z
updated: 2026-07-09T00:25:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Click "Use my location" on the dashboard in a real browser and grant/deny the permission prompt
expected: Granting adds a "My Location" card; denying/unavailable/unsupported shows the matching i18n alert text; button and alert render correctly in both light/dark theme and en/ja locale
result: pass

### 2. Drag two saved city cards to reorder them, then perform an actual full page reload (F5) and confirm the new order is still shown
expected: Card order after reload matches the order set by the drag gesture
result: pass

### 3. Visually inspect the new richer-conditions fields (feels-like, precipitation, UV index, sunrise/sunset), the last-updated/refresh row, and the drag handle affordance on WeatherCard and CityDetailPage in both light and dark theme and both en/ja locales
expected: All new fields/icons/spacing look correct and readable in every theme/locale combination; the refresh button's spinner icon actually animates while a refetch is in flight
result: pass

### 4. Visually inspect the new wind-speed-unit toggle on the Settings page in both light/dark theme and both en/ja locales
expected: Toggle renders correctly, matches the temperature-unit toggle's visual style, and both labels read naturally in Japanese
result: pass

### 5. Review the 4 open WARNING-level findings in 07-REVIEW.md (WR-01 route-id/id:0 collision, WR-02 silently-swallowed hourly fetch errors, WR-03 unguarded sunrise/sunset array access, WR-04 buttons nested inside the card's anchor / invalid HTML) and decide whether to fix now or accept as tracked debt
expected: A developer decision: fix before shipping v1.1, or explicitly accept via a VERIFICATION.md override / follow-up issue
result: pass
decision: Accepted as tracked debt (WR-01 through WR-04) — none reachable via app-generated navigation, none blocks a phase must-have. Not fixed in this phase.

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
