import Arweave from 'arweave/web';

export const arweave = Arweave.init({host: 'arweave.net', port: 443, protocol: 'https', timeout: 60000});
