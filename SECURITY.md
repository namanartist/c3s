# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 2.x (Latest) | Yes |
| < 2.0   | No |

---

## Secret & API Key Management Guidelines

UniMap requires environment variables to connect to database services and external tools. Follow these strict security rules when contributing:

1. **Never Commit Secrets**:
   - Never commit `.env`, connection strings, or credentials to public or private version control.
   - Verify that your secrets exist only in your local `.env` file, which is ignored by `.gitignore`.

2. **MongoDB Connection Security**:
   - The `MONGO_URL` environment variable should use a restricted database user with read/write access scoped only to the `UniMap` database.
   - Avoid using cluster admin accounts for application connections.

3. **Client-Side API Base URLs**:
   - Only expose non-sensitive configuration keys with the `VITE_` prefix (e.g. `VITE_API_BASE_URL`).
   - Server-only secrets (such as database passwords) must remain accessible strictly on the backend (`api/` or `dev-api-server.js`).

---

## Reporting a Vulnerability

If you discover a potential security vulnerability within UniMap:

1. **Do NOT open a public GitHub issue**.
2. Email details of the vulnerability privately to the project maintainers.
3. Include clear steps to reproduce the issue, potential impact, and suggested remediations if known.
4. Maintainers will acknowledge your report within 48 hours and provide updates on resolution.
