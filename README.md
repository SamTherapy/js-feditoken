# JS-Feditoken

[![Build Status](https://ci.git.froth.zone/api/badges/sam/js-feditoken/status.svg)](https://ci.git.froth.zone/sam/js-feditoken)

Generating a token that can be used to botpost to the Fediverse.

Compatible with Mastodon, Misskey, and Pleroma.

## Usage

Download prebuilt binaries from [here](https://git.froth.zone/sam/js-feditoken/releases/latest) (currently supports x86_64 and arm64 on Linux [glibc or musl], macOS and Windows), download from NPM, or build from source.

### NPM

1. Set up using the [Gitea registry](https://git.froth.zone/sam/fediverse-imagebot/packages)

   ```sh
   npm config set @froth:registry https://git.froth.zone/api/packages/sam/npm/
   ```

2. After setting up the registry, either run it once

   ```sh
   npx --package=@froth/feditoken feditoken
   ```

   or install globally

   ```sh
   npm i -g @froth/feditoken
   ```

### Running from Source

1. You need to have `npm` and `nodejs` installed.

- Node 16 or greater is required.

2. Install `pnpm`: \
   `corepack enable` \
    Check <https://pnpm.io/installation> for more information.

3. Clone the repository: \
   `git clone https://git.froth.zone/sam/js-feditoken.git`

4. Install dependencies: \
   `pnpm i`

5. Build: \
   `pnpm run build`
