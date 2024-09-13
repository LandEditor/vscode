// Keep bootstrap-amd.js from redefining 'fs'.
delete process.env["ELECTRON_RUN_AS_NODE"];
