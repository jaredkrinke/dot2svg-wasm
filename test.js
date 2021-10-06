import fs from "fs";
import { useInstanceString, useNewInstanceString } from "./use.js";

// Can I debug with C source???
// https://developer.chrome.com/blog/wasm-debugging-2019/

// Try this? https://www.wasmtutor.com/webassembly-barebones-wasi
var barebonesWASI = function() {

    var moduleInstanceExports = null;

    var WASI_ESUCCESS = 0;
    var WASI_EBADF = 8;
    var WASI_EINVAL = 28;
    var WASI_ENOSYS = 52;

    var WASI_STDOUT_FILENO = 1;
    var WASI_STDERR_FILENO = 2;

    function setModuleInstance(instance) {

        moduleInstanceExports = instance.exports;
    }

    function getModuleMemoryDataView() {
        // call this any time you'll be reading or writing to a module's memory 
        // the returned DataView tends to be dissaociated with the module's memory buffer at the will of the WebAssembly engine 
        // cache the returned DataView at your own peril!!

        return new DataView(moduleInstanceExports.memory.buffer);
    }

    function fd_prestat_get(fd, bufPtr) {

        return WASI_EBADF;
    }

    function fd_prestat_dir_name(fd, pathPtr, pathLen) {

         return WASI_EINVAL;
    }

    function environ_sizes_get(environCount, environBufSize) {

        var view = getModuleMemoryDataView();

        view.setUint32(environCount, 0, !0);
        view.setUint32(environBufSize, 0, !0);

        return WASI_ESUCCESS;
    }

    function environ_get(environ, environBuf) {

        return WASI_ESUCCESS;
    }

    function args_sizes_get(argc, argvBufSize) {

        var view = getModuleMemoryDataView();

        view.setUint32(argc, 0, !0);
        view.setUint32(argvBufSize, 0, !0);

        return WASI_ESUCCESS;
    }

     function args_get(argv, argvBuf) {

        return WASI_ESUCCESS;
    }

    function fd_fdstat_get(fd, bufPtr) {

        var view = getModuleMemoryDataView();

        view.setUint8(bufPtr, fd);
        view.setUint16(bufPtr + 2, 0, !0);
        view.setUint16(bufPtr + 4, 0, !0);

        function setBigUint64(byteOffset, value, littleEndian) {

            var lowWord = value;
            var highWord = 0;

            view.setUint32(littleEndian ? 0 : 4, lowWord, littleEndian);
            view.setUint32(littleEndian ? 4 : 0, highWord, littleEndian);
       }

        setBigUint64(bufPtr + 8, 0, !0);
        setBigUint64(bufPtr + 8 + 8, 0, !0);

        return WASI_ESUCCESS;
    }

    function fd_write(fd, iovs, iovsLen, nwritten) {

        var view = getModuleMemoryDataView();

        var written = 0;
        var bufferBytes = [];                   

        function getiovs(iovs, iovsLen) {
            // iovs* -> [iov, iov, ...]
            // __wasi_ciovec_t {
            //   void* buf,
            //   size_t buf_len,
            // }
            var buffers = Array.from({ length: iovsLen }, function (_, i) {
                   var ptr = iovs + i * 8;
                   var buf = view.getUint32(ptr, !0);
                   var bufLen = view.getUint32(ptr + 4, !0);

                   return new Uint8Array(moduleInstanceExports.memory.buffer, buf, bufLen);
                });

            return buffers;
        }

        var buffers = getiovs(iovs, iovsLen);
        function writev(iov) {

            for (var b = 0; b < iov.byteLength; b++) {

               bufferBytes.push(iov[b]);
            }

            written += b;
        }

        buffers.forEach(writev);

        if (fd === WASI_STDOUT_FILENO || fd == WASI_STDERR_FILENO) console.log(String.fromCharCode.apply(null, bufferBytes));                            

        view.setUint32(nwritten, written, !0);

        return WASI_ESUCCESS;
    }

    function poll_oneoff(sin, sout, nsubscriptions, nevents) {

        return WASI_ENOSYS;
    }

    function proc_exit(rval) {

        return WASI_ENOSYS;
    }

    function fd_close(fd) {

        return WASI_ENOSYS;
    }

    function fd_seek(fd, offset, whence, newOffsetPtr) {

    }

    function fd_close(fd) {

        return WASI_ENOSYS;
    }

    return {
        args_get : args_get,
        args_sizes_get : args_sizes_get,
        environ_get : environ_get,
        environ_sizes_get : environ_sizes_get,
        fd_close : fd_close,
        fd_fdstat_get : fd_fdstat_get,
        fd_prestat_dir_name : fd_prestat_dir_name,
        fd_prestat_get : fd_prestat_get,
        fd_seek : fd_seek,
        fd_write : fd_write,
        poll_oneoff : poll_oneoff,
        proc_exit : proc_exit,
        setModuleInstance : setModuleInstance,
    }               
}

var wasiPolyfill = new barebonesWASI();

// My code
(async () => {
    const module = await WebAssembly.instantiate(await fs.promises.readFile("./dot2svg.wasm"), {
        wasi_snapshot_preview1: {
            clock_time_get: () => console.log("clock_time_get"),
            environ_get: () => console.log("environ_get"),
            environ_sizes_get: () => console.log("environ_sizes_get"),
            fd_close: () => console.log("fd_close"),
            fd_fdstat_get: () => console.log("fd_fdstat_get"),
            fd_fdstat_set_flags: () => console.log("fd_fdstat_set_flags"),
            fd_filestat_get: () => console.log("fd_filestat_get"),
            fd_read: () => console.log("fd_read"),
            fd_seek: () => console.log("fd_seek"),
            fd_write: wasiPolyfill.fd_write,
            path_filestat_get: () => console.log("path_filestat_get"),
            path_open: () => console.log("path_open"),
            proc_exit: () => console.log("proc_exit"),
        },
    });

    wasiPolyfill.setModuleInstance(module.instance);

    // String used for testing (from command line or hard-coded)
    const dotString = "digraph { a -> b }";
    useNewInstanceString(module, dotString, (dotStringAddress) => {
        useInstanceString(module, () => module.instance.exports.dot2svg(dotStringAddress), svgString => {
            console.log(svgString);
        });
    });
})();
