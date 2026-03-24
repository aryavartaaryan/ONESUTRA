// Empty module — used as browser fallback for Node-only modules (fs, net, tls, etc.)
// Required by the 'telegram' (GramJS) package which imports Node modules internally.
// Next.js Turbopack/webpack resolveAlias points these Node modules here.

// Create a base class that can be safely extended
class EmptyBase {}

// Export both a default object and a class to handle extension attempts
module.exports = {
  default: {},
  EmptyBase,
  // Handle common exports that telegram might expect
  createConnection: () => ({}),
  connect: () => ({}),
  constants: {},
  protocols: {},
};

// Also export as ES module default for compatibility
export default {};
