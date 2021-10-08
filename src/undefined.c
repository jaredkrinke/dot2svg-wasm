#include <stdio.h>
#include <setjmp.h>

FILE* tmpfile() {
    return 0;
}

int setjmp (jmp_buf env) {
	return 0;
}

void longjmp (jmp_buf env, int val) {}

