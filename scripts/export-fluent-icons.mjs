import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import { Resvg } from "@resvg/resvg-js";

const iconBaseNames = [
    "info",
    "document_text",
    "warning",
    "document_one_page",
    "tab_prohibited",
    "checkmark_starburst",
    "person",
    "person_passkey",
];

const preferredSizes = [24, 20, 28, 16, 48];
const style = "regular";

const repoRootPath = process.cwd();
const outputSvgFolderPath = path.join(repoRootPath, "docs", "icons", "svg");
const outputPngFolderPath = path.join(repoRootPath, "docs", "icons", "png", "40");

await fs.mkdir(outputSvgFolderPath, { recursive: true });
await fs.mkdir(outputPngFolderPath, { recursive: true });

async function findIconSvgFile(iconName) {
    for (const size of preferredSizes) {
        const expectedFileName = `${iconName}_${size}_${style}.svg`;
        const matches = await fg(
            [`node_modules/@fluentui/svg-icons/**/${expectedFileName}`],
            { dot: true }
        );
        if (matches.length) return { filePath: matches[0], fileName: expectedFileName };
    }

    // fallback: cualquier tamaño regular
    const fallbackMatches = await fg(
        [`node_modules/@fluentui/svg-icons/**/${iconName}_*_${style}.svg`],
        { dot: true }
    );
    if (fallbackMatches.length) {
        return { filePath: fallbackMatches[0], fileName: path.basename(fallbackMatches[0]) };
    }

    return null;
}

for (const iconName of iconBaseNames) {
    const foundIcon = await findIconSvgFile(iconName);

    if (!foundIcon) {
        console.warn(`❌ No encontrado en @fluentui/svg-icons: ${iconName}`);
        continue;
    }

    const svgText = await fs.readFile(foundIcon.filePath, "utf8");

    // Guardar SVG
    const outputSvgFilePath = path.join(outputSvgFolderPath, foundIcon.fileName);
    await fs.writeFile(outputSvgFilePath, svgText, "utf8");

    // Convertir a PNG 40px de ancho
    const resvgInstance = new Resvg(svgText, { fitTo: { mode: "width", value: 40 } });
    const pngBinary = resvgInstance.render().asPng();

    const outputPngFileName = foundIcon.fileName.replace(".svg", ".png");
    const outputPngFilePath = path.join(outputPngFolderPath, outputPngFileName);
    await fs.writeFile(outputPngFilePath, pngBinary);

    console.log(`✅ ${iconName} -> ${path.relative(repoRootPath, outputPngFilePath)}`);
}

console.log("\nListo: SVG en docs/icons/svg y PNG(40px) en docs/icons/png/40");
