#!/bin/sh

export CC=/opt/wasi-sdk/bin/clang
export CXX=/opt/wasi-sdk/bin/clang++
export CFLAGS="-Os -I$PWD/include -D_WASI_EMULATED_SIGNAL -D_SIGNAL_H"
export CXXFLAGS="$CFLAGS"

# Configure script doesn't allow changing the archiver...
export PATH="/opt/wasi-sdk/bin:$PATH"

cd graphviz
./autogen.sh
./configure --host=wasm32 --disable-shared --disable-ltdl
make
cd ..

make

