# FA6 icon pack for Stream Deck
This repo can generate [Elgato Stream Deck](https://www.elgato.com/en/stream-deck) icon packs for [Font Awesome](https://fontawesome.com/).

## Installing
The [Solid](https://apps.elgato.com/icons/com.fortawsome.solid.free) and [Regular](https://apps.elgato.com/icons/com.fortawsome.regular.free) free icon sets are published to the Elgato store.

If you run the release of any of the icon families, you will find the packed version under the Release folder. You can double click these packs to install them locally.

## Running

You need nodejs and npm.

You also need to download the [distribution tool](https://developer.elgato.com/documentation/stream-deck/icon-packs/packaging/). Place that file in the root directory of the repo (next to the package.json file).

Install the packages:

```bash
npm i
```
After the npm packages are install you can either the scripts from the package.json file or call the index file directly.

There are two scripts per font face. The build script will generate all the icons

```bash
npm run build:solid
```

The release script will use the distribution tool to pack the icons. The release script also runs the build so it is not necessary to run both.

```bash
npm run release:solid
```

## Pro Icons

The scripts can generate icons from the FA Pro icons sets but cannot be distributed.

If you want to use the Pro icons you will need to [download](https://fontawesome.com/download) Pro "for the web".

Extract the zip file and copy the ttf file(s) from the `webfonts` folder for the icons you want to use (e.g. fa-sharp-solid-900.ttf).

You also need to copy the `categories.yml` and `icons.yml` from the `metadata`.

Place these files in the `pro` folder and the run `npm run release:[your choice]`.
