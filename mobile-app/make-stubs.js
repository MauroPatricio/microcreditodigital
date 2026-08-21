const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'node_modules', 'react-native-worklets', 'src');

const files = [
  'bundleMode/metroOverrides.d.ts',
  'bundleMode/network.d.ts',
  'debug/errors.d.ts',
  'debug/WorkletsError.d.ts',
  'memory/bundleUnpacker.d.ts',
  'memory/customSerializableUnpacker.d.ts',
  'memory/shareableGuestUnpacker.d.ts',
  'memory/shareableHostUnpacker.d.ts',
  'memory/synchronizableUnpacker.d.ts',
  'threads.d.ts'
];

for (const file of files) {
  const fullPath = path.join(srcDir, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, 'export declare const registerWorkletsError: any; export declare const setupMicrotasks: any; export declare const disallowRNImports: any; export declare const mockTurboModuleRegistry: any; export declare const silenceHMRWarnings: any; export declare const initializeNetworking: any; export declare const registerReportFatalRemoteError: any; export declare const bundleUnpacker: any; export declare const customSerializableUnpacker: any; export declare const shareableGuestUnpacker: any; export declare const shareableHostUnpacker: any; export declare const synchronizableUnpacker: any;');
}
console.log('Stubs created!');
