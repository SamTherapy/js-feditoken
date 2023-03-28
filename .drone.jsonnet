local pipe(arch) = {
  kind: 'pipeline',
  type: 'docker',
  name: arch,
  platform: {
    arch: arch,
  },
  steps: [
    {
      name: 'deps',
      image: 'node',
      commands: [
        'corepack enable && pnpm config set store-dir .cache/pnpm',
        'pnpm i',
      ],
    },
    {
      name: 'lint',
      image: 'node',
      commands: [
        'npm run lint:ci',
      ],
      depends_on: [
        'deps',
      ],
    },
    {
      name: 'build',
      image: 'node',
      commands: [
        'npm run build',
      ],
      depends_on: [
        'lint',
      ],
    },
  ],
  trigger: {
    event: {
      exclude: [
        'tag',
      ],
    },
  },
};

local release(arch) = {
  kind: 'pipeline',
  type: 'docker',
  name: 'release-%s' % [arch],
  platform: {
    arch: arch,
  },
  trigger: {
    event: [
      'tag',
    ],
  },
  steps: [
    {
      name: 'build',
      image: 'node:lts',
      commands: [
        'corepack enable && pnpm config set store-dir .cache/pnpm',
        'pnpm i',
        'pnpm build',
      ],
    },
    {
      name: 'publish',
      image: 'plugins/npm',
      settings: {
        token: {
          from_secret: 'release_api_key',
        },
        registry: 'https://git.froth.zone/api/packages/sam/npm/',
      },
      depends_on: [
        'build',
      ],
    },
  ],
};

[
  pipe('amd64'),
  pipe('arm64'),

  release('amd64'),
  // release('arm64'),
]
