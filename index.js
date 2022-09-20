const yargs = require("yargs");
const {IconWorker} = require("./icon-generator");
const {FileHelpers} = require("./file-helpers");
const path = require("path");
const spawn = require('child_process').spawn;

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
        alias: 'bc',
        demandOption: true,
        type: 'string',
        default: '0A1423',
        describe: 'background color (hex)'
    })
    .option('icon-color', {
        alias: 'ic',
        demandOption: true,
        type: 'string',
        default: 'FFFFFF',
        describe: 'icon color (hex)',
    })

    .boolean('license')
    .alias('license', ['l'])
    .describe('license', 'Generate pro icons. You must have a valid license and you cannot distribute the pack.')
    .default('license', false)

    .boolean('build')
    .alias('build', ['b'])
    .describe('build', 'Run the build')
    .default('build', true)

    .boolean('release')
    .alias('release', ['r'])
    .describe('release','Run the release')

    .check((argv) => {
        let {style, backgroundColor, iconColor, license} = argv

        if (!backgroundColor.match(/^(?:[a-fA-F0-9]{3}){1,2}$/)) {
            throw new Error('Invalid background color, must be in hex format');
        }

        if (!iconColor.match(/^(?:[a-fA-F0-9]{3}){1,2}$/)) {
            throw new Error('Invalid icon color, must be in hex format');
        }

        // set default outputPath
        if (argv.outputPath === undefined) {
            argv.outputPath = `./com.fortawsome.${style}.${license ? 'pro' : 'free'}.sdIconPack`;
        }

        return true;
    })
    .parse(process.argv.slice(2));

class Worker {

    iconWorker;
    options;

    constructor(options) {
        this.options = options;
        this.iconWorker = new IconWorker(this.options);
    }

    async copyAsync() {
        const files = [
            './common/license.txt',
            './common/icon.svg'
        ];

        for (const file of files) {
            await FileHelpers.copyFileAndEnsurePathExistsAsync(file,
                path.join(`com.fortawsome.${this.options.style}.${this.options.license ? 'pro' : 'free'}.sdIconPack/`, path.basename(file)));
        }
    }

    async buildAsync() {
        await this.copyAsync();
        await this.iconWorker.generate(this.options);
    }

    async releaseAsync() {
        await this.buildAsync();
        const style = `${this.options.style}.${this.options.license ? 'pro' : 'free'}`;
        await FileHelpers.removeFileAsync(`./Release/com.fortawsome.${style}.streamDeckIconPack`);
        await spawn('DistributionTool', ['-b', '-i', `com.fortawsome.${style}.sdIconPack`, '-o', 'Release']);
    }
}

const worker = new Worker(argv);

if (argv.release) {
    worker.releaseAsync().then();
}
else if (argv.build) worker.buildAsync().then();
