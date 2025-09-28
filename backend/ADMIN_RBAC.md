# Firebase Auth + MongoDB RBAC

Environment variables required:

- `MONGODB_URI`: MongoDB connection string
- `DATABASE_NAME`: Database name (e.g. `strategy_forge`)
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to Firebase service account JSON
- `FIREBASE_PROJECT_ID`: Firebase project ID

Startup flow:

1) Backend initializes Firebase Admin SDK and MongoDB
2) Each request includes `Authorization: Bearer <Firebase ID token>`
3) Middleware verifies the token and ensures a user doc in `users` with default role `retail`

Collections used:

- `users`: { uid, email, displayName, role, createdAt, lastLogin }
- `admin_audits`: Promotion actions

First admin setup:

1) Register/sign in with Firebase on the frontend
2) After first login, promote in Mongo shell:

```js
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

Promotion endpoint (admin only):

- `POST /api/users/admin/promote` body: `{ "uid": "<target-uid>", "role": "admin" | "retail" }`
  - Adds audit record `{ promotedBy, promotedAt }`

Migration scripts:

1) Backfill roles: `python -m backend.scripts.migrate_add_roles`
2) Create Firebase users for manual accounts and link UID: `python -m backend.scripts.migrate_create_firebase_users`

Duplicate user handling (email-based):

- If a manual and Google user share the same email, create/get a single Firebase user for that email and update both Mongo docs to the same `uid`. Optionally merge profile fields.

Safety checklist:

- Always verify target email/uid before promotion
- Keep service account JSON secret and use least privilege
- Monitor `admin_audits` regularly

