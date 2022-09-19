const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const yargs = require('yargs');
const {registerFont, createCanvas} = require('canvas');

registerFont(require.resolve('@fortawesome/fontawesome-free/webfonts/fa-regular-400.ttf'), {family: 'Font Awesome 6 Regular'});
registerFont(require.resolve('@fortawesome/fontawesome-free/webfonts/fa-solid-900.ttf'), {family: 'Font Awesome 6 Solid'});
registerFont(require.resolve('@fortawesome/fontawesome-free/webfonts/fa-brands-400.ttf'), {family: 'Font Awesome 6 Brands'});

/**
 * Icon set generator options
 * @typedef {Object} GeneratorArguments
 * @property {string} style - Style of Icon Family
 * @property {string} iconColor - Icon font color
 * @property {string} backgroundColor - Background color
 * @property {number} iconSize - Size of the canvas.
 * @property {string} outputPath - Directory path.
 */

/**
 * Icon Manifest
 * @typedef {Object} IconManifest
 * @property {string} path - Path to the image
 * @property {string} name - Name of the icon
 * @property {string[]} tags - Search tags
 */

/**
 * Icon Metadata
 * @typedef {Object} IconMetadata
 * @property {string[]} changes - Version changes.
 * @property {string} label - Name of the icon
 * @property {string[]} styles - Styles available
 * @property {IconMetadataSearch} search - Search tags
 * @property {string} unicode - Unicode value
 * @property {boolean} voted - Was voted
 */

/**
 * Icon Search
 * @typedef {Object} IconMetadataSearch
 * @property {string[]} terms - Search Terms
 */


class IconWorker {
    /**
     * @type {IconMetadata[]}
     */
    iconsMetadata = [];

    /**
     *
     * @type {IconManifest[]}
     */
    iconManifest = [];

    async loadIconMeta() {
        const metaData = await fs.readFile(require.resolve('@fortawesome/fontawesome-free/metadata/icons.yml'))
        this.iconsMetadata = Object.values(yaml.load(metaData));
    }

    async removeFileAsync(filePath) {
        if (!(await fs.stat(filePath)).isFile()) return;
        try {
            await fs.unlink(filePath);
        } catch (e) {
        }
    }

    async removeDirectoryAsync(directory, removeSelf = true) {
        try {
            const files = await fs.readdir(directory) || [];
            for (const file of files) {
                const filePath = path.join(directory, file);
                if ((await fs.stat(filePath)).isFile())
                    await this.removeFileAsync(filePath);
                else
                    await this.removeDirectoryAsync(filePath);
            }
        } catch (e) {
            return;
        }
        if (removeSelf)
            await fs.rmdir(directory);
    }

    async writeFileAndEnsurePathExistsAsync(filePath, content) {
        await fs.mkdir(path.dirname(filePath), {recursive: true});

        await fs.writeFile(filePath, content);
    }

    /**
     *
     * @param options {GeneratorArguments}
     * @return {Promise<void>}
     */
    async generate(options) {
        if (this.iconsMetadata.length === 0) await this.loadIconMeta();
        this.iconManifest = [];

        let outputPath = (options.outputPath = path.resolve(path.normalize(options.outputPath)));

        await this.removeDirectoryAsync(path.join(outputPath, 'icons'), false);

        for (const metaData of this.iconsMetadata.filter(x => x.styles.includes(options.style))) {
            let unicodeIcon = String.fromCodePoint(parseInt(metaData.unicode, 16));

            let iconFileName = `${this.slugify(metaData.label)}.png`;
            console.log(`Generating ${iconFileName}...`);

            let iconBuffer = this.drawIcon(unicodeIcon, 144, options.style, options.backgroundColor, options.iconColor);
            await this.writeFileAndEnsurePathExistsAsync(path.join(options.outputPath, 'icons', iconFileName), iconBuffer);

            metaData.search.terms.push(metaData.label.replace(',', '').replace('\'', '\\\''));

            this.iconManifest.push({
                name: metaData.label,
                path: iconFileName,
                tags: metaData.search.terms
            });
        }

        await this.writeFileAndEnsurePathExistsAsync(path.join(options.outputPath, 'icons.json'),
            JSON.stringify(this.iconManifest, null, 2));
    }

    slugify(text) {
        if (!text) {
            return text;
        }
        return text                           // Cast to string (optional)
            .normalize('NFKD')            // Normalize() using NFKD method returns the Unicode Normalization Form of a given string.
            .toLowerCase()                  // Convert the string to lowercase letters
            .trim()                                  // Remove whitespace from both sides of a string (optional)
            .replace(/\s+/g, '-')            // Replace spaces with -
            .replace(/[^\w\-]+/g, '')     // Remove all non-word chars
            .replace(/--+/g, '-');        // Replace multiple - with single -
    }

    drawIcon(unicode, size, style, backgroundColor, iconColor, margin) {
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = `#${backgroundColor}`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = `#${iconColor}`;
        ctx.globalAlpha = 1;

        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        let fontFamily;
        switch (style) {
            case 'regular':
                fontFamily = 'Font Awesome 6 Free Regular';
                break;
            case 'brands':
                fontFamily = 'Font Awesome 6 Brands Regular';
                break;
            case 'solid':
            default:
                fontFamily = 'Font Awesome 6 Free Solid';
                break;
        }

        ctx.font = `180px '${fontFamily}'`;

        const textMetrics = ctx.measureText(unicode);
        const realFontSize = 72// Math.min(180, 180 * ((180 + 5) / textMetrics.width));
        ctx.font = `${realFontSize}px '${fontFamily}'`;

        ctx.fillText(unicode, 72, 72);

        return canvas.toBuffer('image/png');
    }
}


const argv = yargs()
    .parserConfiguration({
        'dot-notation': false,
        'duplicate-arguments-array': false
    })
    .version(false)
    .strict(true)
    .showHelpOnFail(true)
    .alias('help', 'h')
    .option('style', {
        alias: 's',
        type: 'string',
        choices: ['regular', 'solid', 'brands'],
        describe: 'icon style',
        default: 'solid'
    })
    .option('background-color', {
        alias: 'b',
        demandOption: true,
        type: 'string',
        default: '0A1423',
        describe: 'background color (hex)'
    })
    .option('icon-color', {
        alias: 'i',
        demandOption: true,
        type: 'string',
        default: 'FFFFFF',
        describe: 'icon color (hex)',
    })
    .check((argv) => {
        let {style, backgroundColor, iconColor} = argv

        if (!backgroundColor.match(/^(?:[a-fA-F0-9]{3}){1,2}$/)) {
            throw new Error('Invalid background color, must be in hex format');
        }

        if (!iconColor.match(/^(?:[a-fA-F0-9]{3}){1,2}$/)) {
            throw new Error('Invalid icon color, must be in hex format');
        }

        // set default outputPath
        if (argv.outputPath === undefined) {
            argv.outputPath = `./com.fortawsome.${style}.free.sdIconPack`;
        }

        return true;
    })
    .parse(process.argv.slice(2));

new IconWorker().generate(argv).then();
