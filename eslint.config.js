export default [
  {
    ignores: [
      '**/*.html',
      '**/*.css',
      '**/*.scss',
      '**/*.sass',
      'LICENSE',
      '**/*.md',
      'node_modules/'
    ]
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      indent: ['error', 4],
      quotes: ['error', 'double'],
      semi: ['error', 'always']
    }
  }
];
