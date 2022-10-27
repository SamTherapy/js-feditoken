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
        'curl -L https://pnpm.js.org/pnpm.js | node - add --global pnpm@7',
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
        'curl -L https://pnpm.js.org/pnpm.js | node - add --global pnpm@7',
        'pnpm i',
        'pnpm build',
      ],
    },
    {
      name: 'package',
      image: 'node:lts',
      commands: (
        if arch == 'arm64' then
          [
            'wget "https://github.com/ProcursusTeam/ldid/releases/download/v2.1.5-procursus2/ldid_linux_aarch64" -O /usr/local/bin/ldid',
            'chmod +x /usr/local/bin/ldid',
          ] else []
      ) + [
        'npm run package -- -t latest-linux-%s,latest-alpine-%s,latest-macos-%s,latest-win-%s -o dist/bin/feditoken-%s' % [arch, arch, arch, arch, arch],
        'xz -9 dist/bin/*',
      ],
      depends_on: [
        'build',
      ],
    },
    {
      name: 'release',
      image: 'plugins/gitea-release',
      settings: {
        api_key: {
          from_secret: 'release_api_key',
        },
        base_url: 'https://git.froth.zone',
        files: [
          'dist/bin/*',
        ],
      },
      depends_on: [
        'package',
      ],
    } +
    (if arch == 'amd64' then
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
       }
     else {}),
  ],
};

[
  pipe('amd64'),
  pipe('arm64'),

  release('amd64'),
  release('arm64'),
]
