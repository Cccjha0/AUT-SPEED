# API Reference

All endpoints are served under the `/api` prefix. Requests and responses use JSON encoded payloads unless otherwise noted. Error responses follow the shape:

```json
{
  "data": null,
  "error": {
    "message": "Description of what went wrong"
  }
}
```

Standard HTTP error codes:

- `400 Bad Request` â€?Validation failure, missing required fields, duplicate constraint violations.
- `404 Not Found` â€?Requested resource does not exist.
- `500 Internal Server Error` â€?Unexpected server fault.

---

## Health

| Method | Path        | Description            |
| ------ | ----------- | ---------------------- |
| GET    | `/health`   | Service status check.  |

**Response**

```json
{
  "status": "ok",
  "message": "backend ok",
  "timestamp": "2025-11-03T08:15:30.123Z"
}
```

---

## Practices

| Method | Path                  | Description                     |
| ------ | --------------------- | ------------------------------- |
| GET    | `/practices`          | List practices with pagination. |
| GET    | `/practices/:key`     | Retrieve a single practice.     |
| POST   | `/practices`          | Create a practice.              |
| PATCH  | `/practices/:key`     | Update practice name.           |
| DELETE | `/practices/:key`     | Delete a practice.              |

**List Request**

`GET /api/practices?limit=20&skip=0`

**List Response**

```json
{
  "data": {
    "items": [
      { "_id": "...", "key": "tdd", "name": "Test-Driven Development", "createdAt": "...", "updatedAt": "..." }
    ],
    "total": 1,
    "limit": 20,
    "skip": 0
  },
  "error": null
}
```

**Create Request**

```json
{
  "key": "pair-programming",
  "name": "Pair Programming"
}
```

**Create Response**

```json
{
  "data": {
    "_id": "...",
    "key": "pair-programming",
    "name": "Pair Programming",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "error": null
}
```

---

## Claims

| Method | Path                  | Description                                  |
| ------ | --------------------- | -------------------------------------------- |
| GET    | `/claims`             | List claims (filter by `practiceKey`).       |
| GET    | `/claims/:key`        | Retrieve a single claim.                     |
| POST   | `/claims`             | Create a claim linked to a practice.         |
| PATCH  | `/claims/:key`        | Update claim text or associated practice.    |
| DELETE | `/claims/:key`        | Delete a claim.                              |

**List Request**

`GET /api/claims?practiceKey=tdd&limit=20&skip=0`

**Create Request**

```json
{
  "key": "tdd-improves-quality",
  "practiceKey": "tdd",
  "text": "TDD improves software quality."
}
```

---

## Submissions

| Method | Path                    | Description                                          |
| ------ | ----------------------- | ---------------------------------------------------- |
| POST   | `/submissions`          | Queue a new article submission.                      |
| GET    | `/submissions/:id`      | Retrieve submission details.                         |
| GET    | `/submissions`          | List submissions (filter by `status`).               |
| PATCH  | `/submissions/:id/accept` | Mark submission as accepted.                       |
| PATCH  | `/submissions/:id/reject` | Reject submission with a reason.                   |

**Create Request**

```json
{
  "title": "Empirical Study of TDD",
  "authors": ["Alice Example", "Bob Example"],
  "venue": "ICSE",
  "year": 2024,
  "doi": "10.1000/example",
  "volume": "10",\n  "number": "2",\n  "pages": "101-110",\n  "doi": "10.1000/example",\n  "submittedBy": "Alice Example",\n  "submitterEmail": "alice@example.com"
}
```

**List Request**

`GET /api/submissions?status=queued&limit=20&skip=0`

---

## Moderation

| Method | Path                          | Description                           |
| ------ | ----------------------------- | ------------------------------------- |
| GET    | `/moderation/queue`           | List queued submissions.              |
| POST   | `/moderation/:id/accept`      | Approve queued submission.            |
| POST   | `/moderation/:id/reject`      | Reject queued submission with reason. |

**Reject Request**

```json
{
  "rejectionReason": "Insufficient evidence"
}
```

---

## Evidence

| Method | Path               | Description                                            |
| ------ | ------------------ | ------------------------------------------------------ |
| POST   | `/evidence`        | Create evidence entry referencing accepted submission. |
| GET    | `/evidence/:id`    | Retrieve evidence detail.                              |
| GET    | `/evidence`        | List evidence records with filters and pagination.     |

**Create Request**

```json
{
  "articleDoi": "10.1000/example",
  "practiceKey": "tdd",
  "claimKey": "tdd-improves-quality",
  "result": "agree",
  "methodType": "experiment",
  "participantType": "practitioner",
  "notes": "Large scale field study",
  "analyst": "moderator@example.com"
}
```

**List Request**

`GET /api/evidence?practiceKey=tdd&claimKey=tdd-improves-quality&result=agree&from=2020&to=2025&limit=20&skip=0`

**List Response (excerpt)**

```json
{
  "data": {
    "items": [
      {
        "_id": "...",
        "articleDoi": "10.1000/example",
        "practiceKey": "tdd",
        "claimKey": "tdd-improves-quality",
        "result": "agree",
        "methodType": "experiment",
        "participantType": "practitioner",
        "article": {
          "title": "Empirical Study of TDD",
          "year": 2024,
          "doi": "10.1000/example"
        }
      }
    ],
    "total": 1,
    "limit": 20,
    "skip": 0,
    "aggregations": {
      "resultCounts": {
        "agree": 1,
        "disagree": 0,
        "mixed": 0
      }
    }
  },
  "error": null
}
```

---

## Ratings

| Method | Path             | Description                                     |
| ------ | ---------------- | ----------------------------------------------- |
| POST   | `/ratings`       | Submit rating for an article (1â€? stars).       |
| GET    | `/ratings/avg`   | Retrieve average rating for `doi`.              |

**Submit Request**

```json
{
  "doi": "10.1000/example",
  "stars": 4,
  "user": "moderator@example.com"
}
```

**Average Request**

`GET /api/ratings/avg?doi=10.1000/example`

**Average Response**

```json
{
  "data": {
    "doi": "10.1000/example",
    "average": 4.0,
    "count": 3
  },
  "error": null
}
```

---

## Staff

> **Auth:** Requires an `admin` role token (guard is bypassed automatically when `NODE_ENV === 'test'`).

| Method | Path          | Description                                                    |
| ------ | ------------- | -------------------------------------------------------------- |
| GET    | `/staff`      | List staff. Supports `role=<role>` and `active=true|false`.    |
| POST   | `/staff`      | Create a staff member with email, name, roles, password, etc.  |
| PATCH  | `/staff/:id`  | Update fields (email, name, roles, active, password).          |
| DELETE | `/staff/:id`  | Remove a staff member.                                         |

**Create Request**

```json
{
  "email": "moderator@example.com",
  "name": "Queue Moderator",
  "roles": ["moderator", "analyst"],
  "active": true,
  "password": "ChangeMe123"
}
```

**Create Response**

```json
{
  "data": {
    "_id": "64d6a2...",
    "email": "moderator@example.com",
    "name": "Queue Moderator",
    "roles": ["moderator", "analyst"],
    "active": true,
    "lastNotifiedAt": null,
    "lastLoginAt": null,
    "createdAt": "...",
    "updatedAt": "..."
  },
  "error": null
}
```

On first boot the backend seeds this collection either from `NOTIFY_MODERATORS` / `NOTIFY_ANALYSTS` (if present) or with a default trio (`admin@example.com`, `moderator@example.com`, `analyst@example.com`) so you can log in immediately. Update the accounts â€?including their passwords â€?via these endpoints. All queue notifications and authentication now resolve recipients from this collection, with a short-lived cache inside the notifications service.

---

## System

> **Auth:** Admin only.

| Method | Path               | Description                                              |
| ------ | ------------------ | -------------------------------------------------------- |
| GET    | `/system/config`   | Retrieve runtime configuration flags and announcement.   |
| PATCH  | `/system/config`   | Update one or more configuration fields.                 |

**GET Response**

```json
{
  "data": {
    "maintenanceMode": false,
    "submissionsOpen": true,
    "announcement": "",
    "supportEmail": ""
  },
  "error": null
}
```

**PATCH Request**

```json
{
  "maintenanceMode": true,
  "submissionsOpen": false,
  "announcement": "SCHEDULED MAINTENANCE @ 22:00",
  "supportEmail": "ops@example.com"
}
```

Fields are optional; omit any value you do not want to change. UI clients consume this endpoint to toggle maintenance mode, temporarily pause submissions, and publish operator messages.

---

## Search

Read-only endpoints that aggregate data for UI consumption.

| Method | Path                    | Description                                     |
| ------ | ----------------------- | ----------------------------------------------- |
| GET    | `/search/practices`     | Search practices (`query`, `limit`, `skip`).    |
| GET    | `/search/claims`        | Search claims (`practiceKey`, `query`, etc.).   |
| GET    | `/search/evidence`      | Search evidence with filters, returns aggregations. |
| GET    | `/search/ratings/avg`   | Same as ratings average helper.                 |

**Example**

`GET /api/search/practices?query=tdd&limit=20&skip=0`

```json
{
  "data": {
    "items": [
      { "key": "tdd", "name": "Test-Driven Development" }
    ],
    "total": 1,
    "limit": 20,
    "skip": 0
  },
  "error": null
}
```


---

## Admin Seeding

> **Availability:** Routes are enabled by default in all environments. To disable them in production, set `ADMIN_SEED_DISABLED=true`.

Admin endpoints load predefined demo data and are idempotent (repeated calls simply increase the `skipped` count).

| Method | Path                               | Description                                   |
| ------ | ---------------------------------- | --------------------------------------------- |
| POST   | `/admin/seed/practices`            | Upsert demo practices.                        |
| POST   | `/admin/seed/claims`               | Upsert demo claims.                           |
| POST   | `/admin/seed/submissions-accepted` | Upsert demo submissions with `status=accepted`. |
| POST   | `/admin/seed/evidence`             | Upsert demo evidence referencing accepted DOIs. |
| POST   | `/admin/seed/all`                  | Runs the four endpoints sequentially and aggregates results. |

**Example**

`POST /api/admin/seed/all`

```json
{
  "data": {
    "inserted": 9,
    "skipped": 0,
    "details": [
      { "type": "practices", "inserted": 3, "skipped": 0, "details": [ ... ] },
      { "type": "claims", "inserted": 4, "skipped": 0, "details": [ ... ] },
      { "type": "submissions", "inserted": 2, "skipped": 0, "details": [ ... ] },
      { "type": "evidence", "inserted": 3, "skipped": 0, "details": [ ... ] }
    ]
  },
  "error": null
}
```

Subsequent calls return the same shape but with `inserted: 0` and `skipped` reflecting the number of already-present records.

