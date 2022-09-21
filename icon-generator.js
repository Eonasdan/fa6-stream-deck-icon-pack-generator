const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const {registerFont, createCanvas} = require('canvas');
const {FileHelpers} = require("./file-helpers");

// registerFont(require.resolve('@fortawesome/fontawesome-free/webfonts/fa-regular-400.ttf'), {family: 'Font Awesome 6 Regular'});
// registerFont(require.resolve('@fortawesome/fontawesome-free/webfonts/fa-solid-900.ttf'), {family: 'Font Awesome 6 Solid'});
// registerFont(require.resolve('@fortawesome/fontawesome-free/webfonts/fa-brands-400.ttf'), {family: 'Font Awesome 6 Brands'});

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

/**
 * Icon Metadata
 * @typedef {Object} IconCategories
 * @property {string[]} icons - Icons in this category.
 * @property {string} label - Name of the category
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

    /**
     *
     * @type {IconCategories[]}
     */
    iconCategories = [];

    constructor(options) {
        this.options = options;

        let fontPath;
        let fontFamily;
        switch (this.options.style) {
            case 'regular':
                if (this.options.license) {
                    fontFamily = 'Font Awesome 6 Pro Regular';
                    fontPath = './pro/';
                } else {
                    fontFamily = 'Font Awesome 6 Free Regular';
                    fontPath = '@fortawesome/fontawesome-free/webfonts/';
                }
                fontPath += 'fa-regular-400.ttf';
                break;
            case 'brands':
                if (this.options.license) {
                    fontPath = './pro/';
                } else {
                    fontPath = '@fortawesome/fontawesome-free/webfonts/';
                }
                fontPath += 'fa-brands-400.ttf';
                fontFamily = 'Font Awesome 6 Brands Regular';
                break;
            case 'light':
                fontPath = './pro/fa-light-300.ttf';
                fontFamily = 'Font Awesome 6 Pro Light';
                break;
            case 'sharp':
                fontPath = './pro/fa-sharp-solid-900.ttf';
                fontFamily = 'Font Awesome 6 Sharp Solid';
                break;
            case 'thin':
                fontPath = './pro/fa-thin-100.ttf';
                fontFamily = 'Font Awesome 6 Pro Thin';
                break;
            case 'solid':
            default:
                if (this.options.license) {
                    fontFamily = 'Font Awesome 6 Pro Solid';
                    fontPath = './pro/fa-solid-900.ttf';
                } else {
                    fontFamily = 'Font Awesome 6 Free Solid';
                    fontPath = '@fortawesome/fontawesome-free/webfonts/fa-solid-900.ttf';
                }
                break;
        }

        registerFont(require.resolve(fontPath),
            {family: `${fontFamily} `}) //I have no idea why the space here is required

        this.options.fontFamily = fontFamily;
    }

    async _loadIconMeta() {
        let metaData;
        let categories;
        if (!this.options.license) {
            metaData = await fs.readFile(require.resolve('@fortawesome/fontawesome-free/metadata/icons.yml'));
            categories = await fs.readFile(require.resolve('@fortawesome/fontawesome-free/metadata/categories.yml'));
        } else {
            metaData = await fs.readFile(require.resolve('./pro/icons.yml'));
            categories = await fs.readFile(require.resolve('./pro/categories.yml'));
        }

        this.iconCategories = Object.values(yaml.load(categories));
        this.iconsMetadata = Object.values(yaml.load(metaData)).filter(x => x.styles.includes(this.options.style));
    }

    async generate() {
        console.log(`Generating Icons...`);

        if (this.iconsMetadata.length === 0) await this._loadIconMeta();
        this.iconManifest = [];

        let outputPath = (this.options.outputPath = path.resolve(path.normalize(this.options.outputPath)));

        await FileHelpers.removeDirectoryAsync(path.join(outputPath, 'icons'), false);

        this.createCanvas();

        for (const metaData of this.iconsMetadata) {
            let unicodeIcon = String.fromCodePoint(parseInt(metaData.unicode, 16));

            const label = this.slugify(metaData.label);
            let iconFileName = `${label}.png`;

            let iconBuffer = this.drawIcon(unicodeIcon);
            await FileHelpers.writeFileAndEnsurePathExistsAsync(path.join(this.options.outputPath, 'icons', iconFileName), iconBuffer);

            metaData.search.terms.push(label, label.replace(/-/g, ' '));

            const categories = this.iconCategories
                .filter(x => x.icons.includes(metaData.label) || x.icons.includes(label))
                .map(x => x.label);

            metaData.search.terms.push(...categories);

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

    _canvas;

    createCanvas() {
        const canvas = createCanvas(144, 144);
        const ctx = canvas.getContext('2d');

        ctx.globalAlpha = 1;

        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = `72px '${this.options.fontFamily}'`;

        this._canvas = {canvas, ctx};
    }

    resetCanvas() {
        const {ctx, canvas } = this._canvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = `#${this.options.backgroundColor}`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = `#${this.options.iconColor}`;
    }

    drawIcon(unicode) {
        const {ctx, canvas} = this._canvas;

        this.resetCanvas();
        ctx.fillText(unicode, 72, 72);

        return canvas.toBuffer('image/png');
    }
}

exports.IconWorker = IconWorker;
