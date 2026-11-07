// Launch a separate Electron process with development flags scoped to it.
const { spawn } = require('child_process');
const path = require('path');
const env = { ...process.env, TNT_DESIGN_MODE: 'true', TNT_INTERFACE_TEST: 'true' };
delete env.ELECTRON_RUN_AS_NODE;
delete env.TNT_CAPTURE_DIR;
delete env.TNT_PREVIEW_PHASE;
const child = spawn(require('electron'), ['.'], {
  cwd: path.join(__dirname, '..'), env, stdio: 'inherit',
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
