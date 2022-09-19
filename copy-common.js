const fs = require('fs');
const {dirname} = require('path');

function copyFileAndEnsurePathExistsAsync(source, destination) {
    fs.mkdirSync(dirname(destination), {recursive: true});

    fs.copyFileSync(source, destination);
}

function copy() {
    [
        {
            source: './license.txt', destinations: [
                './com.fortawsome.solid.free.sdIconPack/license.txt',
                './com.fortawsome.brands.free.sdIconPack/license.txt'
            ],
        },

        {
            source: './icon.svg', destinations: [
                './com.fortawsome.solid.free.sdIconPack/icon.svg',
                './com.fortawsome.brands.free.sdIconPack/icon.svg'
            ],
        }
    ].forEach(file => {
        file.destinations.forEach(d => {
            console.log(`copying ${file.source} to ${d}`);
            copyFileAndEnsurePathExistsAsync(file.source, d);
        });
    });
}

copy();
