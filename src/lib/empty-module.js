// Empty module — used as browser fallback for Node-only modules (fs, net, tls, etc.)
// Required by the 'telegram' (GramJS) package which imports Node modules internally.
// Next.js Turbopack/webpack resolveAlias points these Node modules here.

// Create a base class that can be safely extended
class EmptyBase { }

// Dummy inspect for util.inspect required by GramJS formatting
const dummyInspect = () => '';
dummyInspect.custom = Symbol.for('nodejs.util.inspect.custom');

const exportsObj = {
    createConnection: () => ({}),
    connect: () => ({}),
    constants: {},
    protocols: {},
    inspect: dummyInspect,
};
exportsObj.EmptyBase = EmptyBase;

module.exports = {
    ...exportsObj,
    default: exportsObj
};
