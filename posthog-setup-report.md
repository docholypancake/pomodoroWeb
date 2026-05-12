<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of your project. The server-side `posthog-node` SDK was added to `tests/server.js` (the static file server used for e2e test runs). PostHog is initialised once at startup with `flushAt: 1` and `flushInterval: 0` so events are sent immediately — appropriate for a short-lived test process. Three new server-side events are captured: `server_started` (on listen), `request_not_found` (404 responses), and `request_error` (400/403/500 responses, with exception capture on 500s). Graceful shutdown via `posthog.shutdown()` is wired to `SIGINT` and `SIGTERM`. Environment variables `POSTHOG_API_KEY` and `POSTHOG_HOST` were added to `.env`. The project already had a thorough client-side integration via `posthog-js` in `src/js/analytics.js`, tracking six events across the productivity and timer pages.

| Event | Description | File |
|---|---|---|
| `server_started` | Fired when the static test server starts listening; includes `port` and `host` properties | `tests/server.js` |
| `request_not_found` | Fired on 404 responses; includes `path` and `method` | `tests/server.js` |
| `request_error` | Fired on 400/403/500 responses; includes `status_code`, `path`, and `method`. 500s also call `captureException` | `tests/server.js` |
| `productivity_page_viewed` | Fired when the productivity page loads | `src/js/analytics.js` |
| `task_created` | Fired when a new todo task is successfully created | `src/js/analytics.js` |
| `task_completed` | Fired when a task is checked off | `src/js/analytics.js` |
| `task_deleted` | Fired when a task is deleted, with `was_completed` and `reason` | `src/js/analytics.js` |
| `task_creation_validation_failed` | Fired when a user tries to create a blank task | `src/js/analytics.js` |
| `urgent_filter_toggled` | Fired when the urgent filter is toggled; includes visible/total task counts | `src/js/analytics.js` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](https://us.posthog.com/project/401582/dashboard/1523244)
- [Tasks created over time](https://us.posthog.com/project/401582/insights/mRxWqQ4x)
- [Task creation → completion funnel](https://us.posthog.com/project/401582/insights/9FNtzy42)
- [Task completed vs deleted](https://us.posthog.com/project/401582/insights/4KEcrw4T)
- [Task creation validation failures](https://us.posthog.com/project/401582/insights/ESb6iZPh)
- [Server request errors and 404s](https://us.posthog.com/project/401582/insights/mRWoqa0F)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
