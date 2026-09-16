# sign.swyx.io

Self-hosted Documenso for swyx, AI Engineer, Latent Space and Smol.
Upstream release: v2.18.0 (`389390c884949fe27c240488a3259da3cdba93e0`).
Deployment source: https://github.com/swyxio/documenso
Railway project: `55ef0045-dc4a-468d-98e1-84edf2dafcae`, swyx's Projects.

Use Google login. Admission allows exactly the configured owner email and
`ai.engineer`, `latent.space`, `smol.ai`; recipients can sign using their document
links without sender accounts. Native organization invitations assign membership.
The server operator can access stored documents; keep sensitive documents scoped
to their intended organization. This instance uses a self-signed sealing certificate.

Resources: one web service (including BullMQ worker), private PostgreSQL and Redis
with persistent volumes, and a dedicated private Railway documents bucket.
Mail uses the existing verified Smol Resend sender. Google uses the existing
swyx.io Tools Web OAuth client with basic profile/email scopes.

Required policy variables:
`NEXT_PRIVATE_ALLOWED_SIGNUP_DOMAINS=ai.engineer,latent.space,smol.ai` and
`NEXT_PRIVATE_ALLOWED_SIGNUP_EMAILS=shawnthe1@gmail.com`.
An empty policy denies all sender accounts. Sign-in, sessions and sender API
guards enforce admission independently of the website's tools password.

Store session/encryption secrets and the password-protected PKCS#12 certificate
outside Git. Preserve them across redeploys. Use
`NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS` and `NEXT_PRIVATE_SIGNING_PASSPHRASE`.
The local recovery directory is `~/.config/documenso-sign` (owner-only).

Deploy from this repository's main branch using `railway up --service documenso-web
--detach`. Startup stops on migration failure or missing signing certificate;
Set `RAILWAY_DOCKERFILE_PATH=docker/Dockerfile` and configure the dashboard health check to `/signin` (300 seconds), five restart retries, and one US West replica. Railway Config as Code is deprecated; this repository does not use railway.toml. A successful health check does not prove signing.

Verify Google login, sender rejection, team isolation, PDF upload, external
recipient signing, final PDF sealing/download, mail delivery and restart recovery.
Record deployed SHA/image and live verification in `VERIFICATION.md`.

Back up PostgreSQL, Redis and object storage separately. A database volume backup
does not back up the documents bucket. Keep a separate encrypted/offline recovery
copy of certificate and stable encryption secrets. Restore tests must preserve
the matching database/object data and keys.

Community Edition and our changes are AGPL-3.0. Source is publicly available;
retain upstream notices and do not enable unlicensed enterprise capabilities.
