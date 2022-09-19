# FA6 icon pack for Stream Deck
This repo can generate both the Solid and Brands icon sets from Font Awesome. To run the release (pack) you need the [distribution tool](https://developer.elgato.com/documentation/stream-deck/icon-packs/packaging/). Place that file in the root directory of the repo (next to the package.json file).

This is not official. I'm waiting for the folks over at [Fort Awesome to approve this](https://github.com/FortAwesome/Font-Awesome/issues/19289). You can however, create the pack yourself and use it locally but not distribute it.

## Todo:

The release process is a bit messy at the moment. I would build a single script that could: run the generator for each family, copy the common files (license, logo icon), delete that particular pack under the release folder and finally run the distribution tool.  
