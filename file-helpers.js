const path = require("path");
const fs = require('fs').promises;

class FileHelpers {

    static async removeFileAsync(filePath) {
        try {
            if (!(await fs.stat(filePath)).isFile()) return;
            await fs.unlink(filePath);
        } catch (e) {
        }
    }

    static async removeDirectoryAsync(directory, removeSelf = true) {
        try {
            const files = await fs.readdir(directory) || [];
            for (const file of files) {
                const filePath = path.join(directory, file);
                if ((await fs.stat(filePath)).isFile())
                    await FileHelpers.removeFileAsync(filePath);
                else
                    await FileHelpers.removeDirectoryAsync(filePath);
            }
        } catch (e) {
            return;
        }
        if (removeSelf)
            await fs.rmdir(directory);
    }

    static async writeFileAndEnsurePathExistsAsync(filePath, content) {
        await fs.mkdir(path.dirname(filePath), {recursive: true});

        await fs.writeFile(filePath, content);
    }

    static async copyFileAndEnsurePathExistsAsync(source, destination) {
        await fs.mkdir(path.dirname(destination), {recursive: true});

        await fs.copyFile(source, destination);
    }
}

exports.FileHelpers = FileHelpers;
