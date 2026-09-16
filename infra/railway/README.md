# Former sign.swyx.io instance

Retired 2026-09-16. All four deployments (web, backup, Redis and Postgres) were stopped. Railway accepted deletion of project `55ef0045-dc4a-468d-98e1-84edf2dafcae`, scheduled for `2026-09-18T18:52:31.376Z`. `sign.swyx.io` now redirects through Cloudflare to [native Drive signing](https://drive.swyx.io/sign). Do not redeploy this instance. The configuration below is historical recovery documentation.

All six envelopes were explicitly TEST ONLY. Five team documents and seven PDF versions, including both completed seals and their unsigned originals, were copied into the corresponding Papra spaces without re-sealing. The personal draft remains operator-only. The 211,933-byte PostgreSQL dump passed an actual temporary restoration; it and all eight source PDFs were archived to private `papra-drive-backups/retired/documenso/2026-09-16/` with complete SHA-256 readbacks. Recovery keys/certificate remain owner-only at `~/.config/documenso-sign`. The public source fork is retained.


Self-hosted Documenso for swyx, AI Engineer, Latent Space and Smol.
Upstream release: v2.18.0 (`389390c884949fe27c240488a3259da3cdba93e0`).
Deployment source: https://github.com/swyxio/documenso
Railway project: `55ef0045-dc4a-468d-98e1-84edf2dafcae`, swyx's Projects.

Use Google login. Admission allows exactly the configured owner email and
`ai.engineer`, `latent.space`, `smol.ai`; recipients can sign using their document
links without sender accounts. Verified Google accounts automatically join their
domain's organization as members. Invitations remain available for exceptions.
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

`NEXT_PRIVATE_DOMAIN_ORGANISATIONS` maps exact domains to native organization IDs:
`{"ai.engineer":"org_vvhusfyebfaykvmk","latent.space":"org_crzkzfsakkuzoure","smol.ai":"org_zarlbakfcmiaaksy"}`.
Every Google sign-in enrolls a verified matching identity and opens that team's
documents when no other destination was requested. Existing roles are retained;
new accounts receive Member access only. Repeated/concurrent sign-ins do not
duplicate membership. The exact Gmail owner exception keeps its existing team
selection. Disable a user to revoke domain enrollment and sender access; removing
membership alone permits that user to rejoin at their next Google sign-in.
Domain enrollment is for this billing-disabled Community Edition deployment.

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

## Backups

PostgreSQL and Redis volumes use native daily (6 days), weekly (27 days), and monthly (89 days) backups. Redis additionally uses AOF with every-second fsync.

The separate `documenso-backup` service runs at 10:00 UTC daily. Its Dockerfile and script are in `backup/`. It creates a compressed transactional database dump and copies private document objects into the private `backups` bucket. A manifest, written last, records sizes and SHA-256 hashes; snapshots without manifests are incomplete. Snapshots are retained until an operator removes them. Restore the database dump and objects from the same snapshot with the retained encryption keys and sealing certificate. These backups are in the same Railway workspace; retain an offline copy for provider loss.

Deploy the backup service with `railway up infra/railway/backup --path-as-root --service documenso-backup --detach`. Configure its cron to `0 10 * * *`, restart policy Never, and use separate bucket-scoped documents and backups S3 credentials. Credentials remain outside Git. A backup exceeding 1GB compressed database size fails and needs operator intervention.
