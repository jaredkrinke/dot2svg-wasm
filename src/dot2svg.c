#include <malloc.h>
#include <string.h>
#include <gvc.h>

#define WASM_EXPORT_AS(name) __attribute__((export_name(name)))
#define WASM_EXPORT(symbol) WASM_EXPORT_AS(#symbol) symbol

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
    // Use Graphviz for converting dot to SVG
	const char* result = NULL;
    GVC_t* context = gvContextPlugins(lt_preloaded_symbols, false);
    if (context) {
        Agraph_t* graph = agmemread(graphString);
        if (graph) {
            if (gvLayout(context, graph, "dot") == 0) {
				char *svg;
				unsigned int svgLength;
                gvRenderData(context, graph, "svg", &svg, &svgLength);
				if (svg) {
					result = strdup(svg);
					gvFreeRenderData(svg);
				}
				gvFreeLayout(context, graph);
            }
            agfree(graph, NULL);
        }
        gvFreeContext(context);
    }

    return result;
}

