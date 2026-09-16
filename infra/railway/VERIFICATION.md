# Live verification — 2026-09-16 UTC

Instance: https://sign.swyx.io. Upstream v2.18.0, pinned release `389390c884949fe27c240488a3259da3cdba93e0`.

## Source and deployment

- Web application source: `5359da3b0`; Railway deployment `3ca0302a-4864-4539-a179-a19b7760886b`, successful.
- Running image: `sha256:155446127994f3eb51b0054f247facf133f400698490f391ba01aee393e2b6ff`.
- Backup source: `f903664ed`; deployment `2011e6bd-3558-4942-b7f2-4c7ef5cd128b`, successful. This revision only changed the backup connection parser, not web application code.
- Public source offer and approved-Google-account wording verified on the live sign-in page.
- Website PR https://github.com/swyxio/swyxdotio/pull/589 merged into master at `521de7bd2ef628b880beef2d332688d39c954785`. Workers Build passed. Production deployment `e0046895-db3b-4809-9e2a-bc80babe7b4e`, version `8373b634-d958-4293-ac7a-cc5d9bbc30ff`, at 100%.
- Live `/tools` contains the Sign documents card; its image returns 200 and `/tools/sign` returns 302 to the signing instance.

## Login, membership and authorization

- Real owner Google sign-in succeeded through the shared swyx.io Tools Web client, with the signing callback registered alongside existing tools. No additional password is required.
- Sender admission permits the exact configured owner and `ai.engineer`, `latent.space`, `smol.ai`. The policy also guards existing sessions and sender APIs.
- Personal, AI Engineer, Latent Space and Smol organizations were created, with separate signing teams at `/t/aie`, `/t/latent-space`, `/t/smol`.
- Live API v1 and v2 tests: an AIE-scoped credential could not list the Smol test document; a Smol-scoped credential could. A disposable unapproved sender was rejected with 401 by both versions. Disposable credentials and the test user were removed. These tests verify API scopes, rather than separate humans' browser sessions.
- A Latent Space member invitation was sent to the explicitly requested teammate. Its MEMBER group maps to the Latent Space team's MEMBER role; membership remains pending until the invite is accepted. No other teammates were invited automatically.

## Signing, email and recovery

- Synthetic PDF uploaded into private S3 storage, one required signature field added, and signing request sent to a controlled owner inbox alias outside sender admission.
- Gmail receipt confirmed SPF and DKIM passing for the verified Smol sender.
- The owner completed signing from an iPhone through the external recipient link. BullMQ processed sealing and completed-document email jobs. The anonymous recipient route now shows completion.
- The signed PDF downloaded through the application's Signed download control: 217,899 bytes, SHA-256 `c1b7815d8ed6e07d6fdb30e86db9f7b22546c114b662fb2ed58137f956ee080b`.
- OpenSSL CMS verification succeeded against the PDF's complete signed byte ranges. Embedded certificate fingerprint matches the retained sealing certificate: `51:29:22:8B:13:EB:E9:54:F6:60:DC:56:6B:57:D8:13:23:84:A9:DD:D2:75:6F:5E:B5:94:03:DD:2F:23:54:8B`.
- Web service restarted without rebuilding. Owner session, completed document, and signed PDF remained available.
- Redis AOF and every-second fsync verified at runtime. Daily/weekly/monthly native backups configured for Postgres and Redis; initial native backup records read back.
- The explicitly requested teammate received a separate synthetic signing request. The application recorded SENT at 09:28:07 UTC; signing remained pending at verification. Recipient inbox delivery and teammate Google sign-in are not claimed verified.

## Backups

- Daily backup cron: 10:00 UTC. Complete private snapshot `snapshots/2026-09-16T09:29:34.782Z`, compressed database 37,030 bytes, three document objects.
- Every database/object checksum verified against the completed manifest. Object bytes also matched live document storage; the sealed test PDF is included. Anonymous object requests returned 403.
- Matching database and document snapshot copied to the owner-only local recovery directory. The sealing certificate, session/encryption secrets and bucket credentials are retained outside Git.
- Database dump restored into the separate disposable `sign_restore_test_20260916` database with SQL errors treated as failures. The disposable database is removed after verification.

## Limits

The sealing certificate is self-signed. Content signatures verify cryptographically, but PDF readers do not automatically trust its identity. Community Edition enterprise capabilities remain disabled. Native and object snapshots share the Railway provider; the local recovery copy supplies an additional copy, but no separate remote provider backup is configured. Automatic snapshot retention is not configured for the object bucket. The backup script limits compressed database dumps to 1 GB.
