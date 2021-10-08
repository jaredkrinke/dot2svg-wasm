#include <malloc.h>
#include <string.h>
#include <graphviz/gvc.h>

#define WASM_EXPORT_AS(name) __attribute__((export_name(name)))
#define WASM_EXPORT(symbol) WASM_EXPORT_AS(#symbol) symbol

void dot2svg_render(const char* dot, char** svg, unsigned int* svgLength) {
    GVC_t* context = gvContextPlugins(lt_preloaded_symbols, false);
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
void* WASM_EXPORT(allocate)(unsigned int size) {
    return malloc(size);
}

void WASM_EXPORT(deallocate)(void* allocation) {
    free(allocation);
}

// Main export
const char* WASM_EXPORT(dot2svg)(const char* graphString) {
    // TODO: Remove these helpers and also handle memory errors
    // Use Graphviz for converting dot to SVG
    char* resultString;
    unsigned int resultLength;
    dot2svg_render(graphString, &resultString, &resultLength);

    const char* result = strdup(resultString);

    // Free internal resources
    dot2svg_free(&resultString);

    return result;
}

