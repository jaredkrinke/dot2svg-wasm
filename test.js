import fs from "fs";
import { createCString, receiveCString } from "wasm-c-string";

(async () => {
    const textDecoder = new TextDecoder();
    let memory;
    const module = await WebAssembly.instantiate(await fs.promises.readFile("./dot2svg.wasm"), {
        wasi_snapshot_preview1: {
            fd_write: (fileDescriptor, ioVectorsBaseAddress, ioVectorsCount, returnBytesWrittenAddress) => {
                // This is needed to forward Graphviz logging to the console
                // Note: the design is based on POSIX writev(2)

                // Read IO vectors
                const view = new DataView(memory.buffer);
                const ioVectors = [];
                for (let i = 0, address = ioVectorsBaseAddress; i < ioVectorsCount; i++, address += 8) {
                    ioVectors.push({
                        sourceAddress: view.getUint32(address, true),
                        sizeInBytes: view.getUint32(address + 4, true),
                    });
                }

                // Calculate total size
                const totalSizeInBytes = ioVectors.reduce((sum, ioVector) => sum + ioVector.sizeInBytes, 0);

                // Forward STDOUT and STDERR to console
                const standardOutput = 1;
                const standardError = 2;
                switch (fileDescriptor) {
                    case standardOutput:
                    case standardError:
                        {
                            // Copy to buffer
                            const buffer = new Uint8Array(totalSizeInBytes);
                            let offset = 0;
                            ioVectors.forEach(ioVector => {
                                buffer.set(new Uint8Array(memory.buffer, ioVector.sourceAddress, ioVector.sizeInBytes), offset);
                                offset += ioVector.sizeInBytes;
                            });

                            // Note: Adds an extra new line...
                            console.log(textDecoder.decode(buffer));
                        }
                        break;

                    default:
                        // Do nothing
                        break;
                }
        
                // Set return value to total size of writes
                view.setUint32(returnBytesWrittenAddress, totalSizeInBytes, true);
                return 0; // Success
            },

            // Not implemented
            clock_time_get: () => {},
            environ_get: () => {},
            environ_sizes_get: () => {},
            fd_close: () => {},
            fd_fdstat_get: () => {},
            fd_fdstat_set_flags: () => {},
            fd_filestat_get: () => {},
            fd_read: () => {},
            fd_seek: () => {},
            path_filestat_get: () => {},
            path_open: () => {},
            proc_exit: () => {},
        },
    });

    memory = module.instance.exports.memory;

    // String used for testing (from command line or hard-coded)
    const dotString = "digraph { a -> b }";
    createCString(module, dotString, (dotStringAddress) => {
        const svgString = receiveCString(module, () => module.instance.exports.dot2svg(dotStringAddress));
        console.log(svgString);
    });
})();
