// Monorepo phase 1 (EN-14537):
// Compatibility shim so we can continue building an NPM package.
// Once all consumers of this library live in the monorepo, we
// can remove this file.
module.exports = require('common/components');
