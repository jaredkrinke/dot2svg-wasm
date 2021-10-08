SOURCES=\
	src/dot2svg.c \
	src/plugin.c \
	src/undefined.c \

INCDIRS=\
	-I./graphviz/lib/common \
	-I./graphviz/lib/cdt \
	-I./graphviz/lib/cgraph \
	-I./graphviz/lib/gvc \
	-I./graphviz/lib/pathplan \

LIBDIRS=\
	-L./graphviz/lib/gvc/.libs \
	-L./graphviz/lib/common/.libs \
	-L./graphviz/lib/cgraph/.libs \
	-L./graphviz/lib/cdt/.libs \
	-L./graphviz/plugin/dot_layout/.libs \
	-L./graphviz/lib/pathplan/.libs \
	-L./graphviz/plugin/core/.libs \

LIBS=\
	-lgvplugin_core_C \
	-lgvc_C \
	-lcgraph_C \
	-lcdt_C \
	-lgvplugin_dot_layout_C \
	-lpathplan_C \

dot2svg.wasm: $(SOURCES)
	$(CC) $(CFLAGS) $(INCDIRS) $(LIBDIRS) $(LIBS) -nostartfiles -Wl,--no-entry $^ -o $@

