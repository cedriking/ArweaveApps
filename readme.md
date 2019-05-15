# ArweaveApps
This is the source code for the ArweaveApps located at https://arweave.net/
The main purpose of the site is to work as an indexer for the Arweave permaweb.

This is a work in progress with many features coming soon.

### Future updates
- What would be the best way to handle an app that already exists but we want to update the link? Should the first publisher be the only one able to edit this? Doesn't sound right.

### Things I noticed
- In `src/js/` we have `web.bundle.js` but I decided to use `https://unpkg.com/arweave/bundles/web.bundle.min.js` since in the one I downloaded I had this issue `TypeError: arweave.wallets.ownerToAddress is not a function`.
- If an account sends a request but it has 0 balance, we get an `http error 400` but `arweave.transactions.sign(tx, wallet);` doesn't throw an error.