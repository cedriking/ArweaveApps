# ArweaveApps
This is the source code for the ArweaveApps.

The main purpose of the site is to work as an indexer for the Arweave permaweb.

### Things I noticed
- If an account sends a request but it has 0 balance, we get an `http error 400` but `arweave.transactions.sign(tx, wallet);` doesn't throw an error.

### ChangeLog
```
v0.2.3 (https://arweave.net/w4v5TT4blOJ3AfBXxm0NdgD5szSNCP0lGCjUkoRC-xs)
- Added two new categories, ETH dapps and EOS dapps, that go with the bounty https://github.com/ArweaveTeam/Bounties/issues/28

v0.2.2 (https://arweave.net/-qwd78XBQn9kyImIebHfRvYZ_wh20PPep1bd6mqh074)
- Updated full decentralization of gateways, to work with perma.online and future gateways.

v0.2.1 (https://arweave.net/yTHDaOcab_pkmyMCUQv2B9nkZlerT1Ox7dsayDe5ako)
- Updated cache to use webSQL and improved cache load from ~20sec to ~8sec
- Replaced GraphQL to ArQL, temporary rollback
- Solved issue on Publish page and replaced App select with an input text
- upgraded packages to latest version
- removed image upload, will help with future loaded content and cheaper for the user

v0.2.0 (https://arweave.net/6sbzSXo0kjr8V0xjwRfyJ7JifQLqM3Zf1I0j6L_t_Xg)
- Replaced Gulp for ParcelJS. A lot easier and faster to work on newer versions
- Converting all src JS files to typescript and SCSS files to SASS
- Replaced index.html to use Pug and now available over the src dir
- Using GraphQL for most requests instead of ArQL, reducing request time from ~6secs to ~3secs
- Reduced transaction details load time from ~20 seconds to ~5 seconds using request pools

v0.1.5 (https://5nxrbkulhlk5.arweave.net/SxP07l_m3wDJKTYGapy7w-i_vaBjhkKgnFpln5gYn64/index.html)
- Using path manifest
- Updated one line to GraphQL
- Allowing apps that are deployed with path manifest to be added on ArweaveApps

v0.1.4 (https://arweave.net/M7K44qPmrtBwFOLMmofHQCfBC3D0pi3ux0iy5T6Rhk4)
- Temporary removed the use of ArweaveID to increase loading speed.
- Increased timeout for Arweave requests

v0.1.3 (https://arweave.net/fT3yafT-jSp4nOc_SfuUz5JhAD2OGkxQo8g9VX-azeM)
- Updated the design

v0.1.2 (https://arweave.net/S6VgPIIUPxg6M9W89RaUInrrZF0FjBCEsEYlNI7U0Ys)
- Added webworkers + cache for faster loading time.
- Now apps can be directly linked to the latest version! (ex: http://arweaveapps.com/#Zeus/Archive)

v0.1.1 (https://arweave.net/35IFq9BcIgpSPti9YDYDiaQy4wMfMIKZ25t7hHZrhek)
- Drag your wallet file and the login popup will appear!
- Icons are now optional.
- Updated sort for links.
- Updated the padding on each shown link to prevent clicking the title while click on the vote icon.
- Solved a small bug when clicking vote for the same app a second time without a refresh caused a JS error.

v0.1.0 (https://arweave.net/HNciARM0UuSxnZvne6W_jWy2YG08YZFnxKuBr-DtDA8)
- App owners can now "update" their apps by using the same title while publishing.
- Homepage now shows the onwer of an app, showing usernames from ArweaveID.
- Removed all 'alert' and replaced with a 'toast'.
- Added preloader in homepage.
- Removed the typescript files and converted to es6.
- Separated every class on their own JS file.
- Only the owner of an app can publish that link.
- Changed the site colors.
- Removed all typescript related packages and updated gulfile.js

v0.0.1
- initial commit and first test version released.
```
