# ArweaveApps
This is the source code for the ArweaveApps located at https://arweave.net/HNciARM0UuSxnZvne6W_jWy2YG08YZFnxKuBr-DtDA8

The main purpose of the site is to work as an indexer for the Arweave permaweb.

This is a work in progress with many features coming soon.

### Things I noticed
- If an account sends a request but it has 0 balance, we get an `http error 400` but `arweave.transactions.sign(tx, wallet);` doesn't throw an error.

### ChangeLog
```
v0.1.0
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