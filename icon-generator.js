const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const {registerFont, createCanvas} = require('canvas');
const {FileHelpers} = require("./file-helpers");

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

    constructor(options) {
        this.options = options;
    }

    async _loadIconMeta() {
        if (!this.options.license) {
            const metaData = await fs.readFile(require.resolve('@fortawesome/fontawesome-free/metadata/icons.yml'))
            this.iconsMetadata = Object.values(yaml.load(metaData));
        }
    }

    async generate() {
        console.log(`Generating Icons...`);

        if (this.iconsMetadata.length === 0) await this._loadIconMeta();
        this.iconManifest = [];

        let outputPath = (this.options.outputPath = path.resolve(path.normalize(this.options.outputPath)));

        await FileHelpers.removeDirectoryAsync(path.join(outputPath, 'icons'), false);

        for (const metaData of this.iconsMetadata.filter(x => x.styles.includes(this.options.style))) {
            let unicodeIcon = String.fromCodePoint(parseInt(metaData.unicode, 16));

            let iconFileName = `${this.slugify(metaData.label)}.png`;

            let iconBuffer = this.drawIcon(unicodeIcon, 144, this.options.style, this.options.backgroundColor, this.options.iconColor);
            await FileHelpers.writeFileAndEnsurePathExistsAsync(path.join(this.options.outputPath, 'icons', iconFileName), iconBuffer);

            metaData.search.terms.push(metaData.label.replace(',', '').replace('\'', '\\\''));

            this.iconManifest.push({
                name: metaData.label,
                path: iconFileName,
                tags: metaData.search.terms
            });
        }

        await FileHelpers.writeFileAndEnsurePathExistsAsync(path.join(this.options.outputPath, 'icons.json'),
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
        const realFontSize = 72// Math.min(180, 180 * ((180 + 5) / textMetrics.width)); //todo
        ctx.font = `${realFontSize}px '${fontFamily}'`;

        ctx.fillText(unicode, 72, 72);

        return canvas.toBuffer('image/png');
    }
}

exports.IconWorker = IconWorker;
