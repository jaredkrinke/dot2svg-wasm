#include <malloc.h>
#include <string.h>
#include "gvc.h"

#define WASM_EXPORT_AS(name) __attribute__((export_name(name)))
#define WASM_EXPORT(symbol) WASM_EXPORT_AS(#symbol) symbol

// const char* graphString = "digraph { a -> b }";

void dot2svg_render(const char* dot, char** svg, unsigned int* svgLength) {
    GVC_t* context = gvContext();
    if (context) {
        Agraph_t* graph = agmemread(dot);
        if (graph) {
            if (gvLayout(context, graph, "dot") == 0) {
                gvRenderData(context, graph, "svg", svg, svgLength);
            }
            agfree(graph, NULL);
        }
        gvFreeContext(context);
    }
}

void dot2svg_free(char** svg) {
    gvFreeRenderData(*svg);
    *svg = NULL;
}

// WebAssembly exports
// Memory management helpers
unsigned char* WASM_EXPORT(allocate)(unsigned int size) {
    return (unsigned char*)malloc(size);
}

void WASM_EXPORT(deallocate)(unsigned char* allocation) {
    free(allocation);
}

typedef struct {
    unsigned int length;
    char buffer[];
} wasm_string;

// Main export
wasm_string* WASM_EXPORT(dot2svg)(const char* graphString) {
    // TODO: Remove these helpers and also handle memory errors
    // Use Graphviz for converting dot to SVG
    char* resultString;
    unsigned int resultLength;
    dot2svg_render(graphString, &resultString, &resultLength);

    // Copy the result string into a struct on the heap
    wasm_string* result = (wasm_string*)malloc(sizeof(unsigned int) + resultLength);
    result->length = resultLength;
    memcpy(&result->buffer[0], resultString, resultLength);

    // Free internal resources
    dot2svg_free(&resultString);

    return result;
}
