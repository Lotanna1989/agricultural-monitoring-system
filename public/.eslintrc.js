module.exports = {
  env: {
    serviceworker: true,
    browser: true
  },
  globals: {
    self: 'readonly',
    caches: 'readonly',
    clients: 'readonly'
  }
};