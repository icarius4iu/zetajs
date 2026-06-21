# Releasing to Maven Central

This library is configured to publish to **Maven Central** via the
[Central Portal](https://central.sonatype.com) under the namespace
**`io.github.icarius4iu`**. Published coordinates:

```
io.github.icarius4iu:invoice-lib:0.1.0
```

The POM already has everything Central requires (name, description, url, license,
developers, scm) and a `release` profile that builds the **sources** and
**javadoc** jars, **GPG-signs** every artifact, and uploads with the
`central-publishing-maven-plugin`. The steps below are the **one-time account
setup** plus the **release command** — these need your own accounts and keys, so
they are not automated here.

> ⚠️ Artifacts on Maven Central are **permanent and immutable** — a published
> version can never be changed or deleted. Double-check before releasing.

## 1. One-time: claim the namespace

1. Sign in at <https://central.sonatype.com> (you can use your GitHub account).
2. Go to **Namespaces → Add Namespace** and add `io.github.icarius4iu`.
3. Central shows a **verification code**. Create a **public** GitHub repository
   named exactly that code under <https://github.com/icarius4iu>, then click
   **Verify**. Once verified you own the namespace (the temp repo can be deleted).

## 2. One-time: generate a publishing token

In the Portal: **Account → Generate User Token**. You get a `username` /
`password` pair — these are not your login, they are the deploy credentials.

Put them in `~/.m2/settings.xml` under the server id **`central`** (matches
`publishingServerId` in the POM):

```xml
<settings>
  <servers>
    <server>
      <id>central</id>
      <username>TOKEN_USERNAME</username>
      <password>TOKEN_PASSWORD</password>
    </server>
  </servers>
</settings>
```

## 3. One-time: a GPG key (to sign the artifacts)

```sh
gpg --full-generate-key                     # pick RSA 4096; remember the passphrase
gpg --list-keys --keyid-format long         # note your KEY_ID
gpg --keyserver keyserver.ubuntu.com --send-keys KEY_ID   # publish the public key
```

The signing step uses `gpg-agent`. For a non-interactive/CI run, pass the
passphrase explicitly: add `-Dgpg.passphrase=…` to the deploy command.

## 4. Release

```sh
cd examples/invoice-lib-java
mvn -Prelease deploy
```

This builds + tests, attaches the sources and javadoc jars, signs everything,
and uploads to the Central Portal. Because `autoPublish=false`, it stops at a
**validated** deployment — open the **Deployments** tab at
<https://central.sonatype.com>, review it, and click **Publish** to release it
(this step is permanent). It then syncs to <https://search.maven.org> within
~10–30 minutes.

## 5. Cut the next version

Bump `<version>` in `pom.xml` (Central rejects re-publishing an existing
version, and `-SNAPSHOT` versions are not allowed for releases), then repeat
step 4.

## Alternative: GitHub Packages

If you only need it inside your own org (consumers authenticate with a GitHub
token), publishing to GitHub Packages is lighter: add a `distributionManagement`
block pointing at `https://maven.pkg.github.com/icarius4iu/zetajs`, a `github`
server in `settings.xml` with a PAT that has `write:packages`, and run
`mvn deploy`. This is **not** fully public, so Maven Central (above) is the right
choice for an openly consumable library.
