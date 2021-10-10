import { existsSync, promises as fsp } from "fs";

(async () => {
    const outputDirectory = "dist";
    if (!existsSync(outputDirectory)) {
        await fsp.mkdir(outputDirectory);
    }

    const packageJson = JSON.parse(await fsp.readFile("package.json"));
    await Promise.all(
        ["package.json", ...packageJson.files]
        .map(fileName => fsp.copyFile(fileName, `${outputDirectory}/${fileName}`))
    );

    console.log("Done!");
})();
