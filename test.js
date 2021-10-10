import { createAsync } from "./dot2svg.js";

(async () => {
    const converter = await createAsync();

    // String used for testing (from command line or hard-coded)
    const dotString = process.argv[2] ?? "digraph { a -> b }";
    const result = converter.dotToSVG(dotString);
    if (result) {
        console.log(result);
    } else {
        console.log(converter.getConsoleOutput());
    }
})();
