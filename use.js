const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// Pass in a factory for an object with a "dispose" property and this will
// ensure "dispose" is called on the object after the provided lambda returns
// or throws
export const use = (create, run) => {
    const o = create();
    try {
        run(o);
    } finally {
        o.dispose();
    }
};

// Manage the lifetime of an allocation
export const useInstanceAllocation = (module, create, run) => {
    use(() => {
        // Create the disposable object first
        const objectWithDispose = {
            address: 0,
            dispose: function() { module.instance.exports.deallocate(this.address); },
        };

        // Then allocate
        objectWithDispose.address = create();
        return objectWithDispose;
    }, run);
};

// Manage the lifetime of a *new* allocation (with the given size)
export const useNewInstanceAllocation = (module, size, run) => {
    return useInstanceAllocation(module, () => module.instance.exports.allocate(size), run);
};

// Decode a string and manage its lifetime
export const useInstanceString = (module, create, run) => {
    // Call the "create" function and get back the address of a struct: [size (32-bit unsigned int), byte1, byte2, ...]
    useInstanceAllocation(module, create, ({ address }) => {
        const buffer = module.instance.exports.memory.buffer;
        const encodedStringLength = (new DataView(buffer, address, 4)).getUint32(0, true); // WebAssembly is little endian
        const encodedStringBuffer = new Uint8Array(buffer, address + 4, encodedStringLength); // Skip the 4 byte size
        const str = textDecoder.decode(encodedStringBuffer);
        run(str);
    })
};

// Encode a *new* string and manage its lifetime
export const useNewInstanceString = (module, str, run) => {
    // Encode the string (with null terminator) to get the required size
    const nullTerminatedString = str + "\0";
    const encodedString = textEncoder.encode(nullTerminatedString);

    // Allocate space in linear memory for the encoded string
    useNewInstanceAllocation(module, encodedString.length, ({ address }) => {
        // Copy the string into the buffer
        const destination = new Uint8Array(module.instance.exports.memory.buffer, address);
        textEncoder.encodeInto(nullTerminatedString, destination);

        run(address);
    });
};
