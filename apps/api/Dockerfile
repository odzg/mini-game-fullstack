# syntax=docker/dockerfile:1@sha256:b6afd42430b15f2d2a4c5a02b919e98a525b785b1aaff16747d2f623364e39b6
# check=error=true

# Base image for local development and CI tasks.
# Using Ubuntu keeps package availability simple for Node toolchain dependencies.
FROM ubuntu:latest@sha256:d1e2e92c075e5ca139d51a140fff46f84315c0fdce203eab2807c7e495eff4f9

# All repository files are copied and commands are run from this directory.
WORKDIR /workspace

# Runtime mode used by Node tooling and frameworks.
ENV NODE_ENV=development
# Location where Mise stores downloaded runtimes and metadata.
ENV MISE_DATA_DIR=/root/.local/share/mise
# Add Mise binary and shims to PATH so commands like `mise` and `pnpm`
# are available directly in `RUN` instructions without shell activation wrappers.
ENV PATH="/root/.local/bin:/root/.local/share/mise/shims:${PATH}"

# Refresh apt package indexes from configured repositories.
# Install curl and CA root certificates, skipping optional recommended packages.
# Remove apt index files in the same layer to reduce image size.
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests first so Docker can reuse dependency layers when
# application source changes but lockfiles/config do not.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Copy Mise configuration that declares exact runtime/tool versions.
COPY mise.toml ./
# Copy workspace sources and tooling used by Nx, apps, and scripts.
COPY apps ./apps
COPY tools ./tools
# Copy workspace-level config referenced during install/build tasks.
COPY nx.json tsconfig.base.json tsconfig.json eslint.config.ts .gitignore ./

# Install Mise version manager.
RUN curl https://mise.run | sh

# Trust this repository for Mise and install all tools declared in `mise.toml`.
# This ensures shims (for example `pnpm`, `node`) are ready for subsequent steps.
RUN mise trust --yes /workspace
RUN mise install

# Install JavaScript dependencies using the lockfile for reproducible installs.
RUN pnpm install --frozen-lockfile

# API runtime port.
EXPOSE 4000
