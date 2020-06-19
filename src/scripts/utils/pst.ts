import { arweave } from "../app";
import Transaction, { Tag } from "arweave/web/lib/transaction";

export interface ContractInterface {
  id: string;
  contractSrc: string;
  initState: any;
  minDiff: any;
  contractTx: Transaction;
}

export default class PST {
  private tokenContractId: string;
  private maxPST = 1000000000000;
  private tags: Map<string, any> = new Map();

  constructor(tokenContractId: string, maxPST: number = 1000000000000) {
    this.maxPST = maxPST || 1000000000000;
    this.tokenContractId = tokenContractId;
  }

  public async getPSTAllocation() {
    return this.calculateFeeRecipient(await this.getWalletList());
  }

  public async getWalletList() {
    const tipTx = await this.findContractTip();
    return JSON.parse(await this.getTxState(tipTx)).walletList;
  }

  public async calculateFeeRecipient(stakeHolders: {addr: string, balance: number}[]): Promise<string> {
    const weightedStakeHolders = {};
    for(let i = 0, j = stakeHolders.length; i < j; i++) {
      weightedStakeHolders[stakeHolders[i].addr] = stakeHolders[i].balance / this.maxPST;
    }

    return this.weightedRandom(weightedStakeHolders);
  }

  public async weightedRandom(probability): Promise<string> {
    const r = Math.random();
    let sum = 0;

    for(let i in probability) {
      sum += probability[i];
      if(r <= sum) return i;
    }
  }

  public async findContractTip() {
    const contract = await this.getContract();
    let current = contract.contractTx;
    let state = await this.getTxState(current);
    let last;

    do {
      last = current;
      current = await this.findNextTx(contract, state, current);
      state = await this.getTxState(current);
    } while(current);

    return last;
  }

  public async getContract(): Promise<ContractInterface> {
    const contractTx = await arweave.transactions.get(this.tokenContractId);
    const contractSrcTxId = await this.getTag(contractTx, 'Contract-Src');
    const minDiff = await this.getTag(contractTx, 'Min-Diff');
    const contractSrcTx = await arweave.transactions.get(contractSrcTxId);
    const contractSrc = await contractSrcTx.get('data', {decode: true, string: true});
    const state = await contractTx.get('data', {decode: true, string: true});

    return {
      id: this.tokenContractId,
      contractSrc,
      initState: state,
      minDiff,
      contractTx
    }
  }

  public async findNextTx(contract: ContractInterface, state: any, currentTx: Transaction): Promise<Transaction> {
    const successorsQuery = {
      op: 'and',
      expr1: {
        op: 'equals',
        expr1: 'App-Name',
        expr2: 'SmartWeave'
      },
      expr2: {
        op: 'equals',
        expr1: 'Previous-TX',
        expr2: currentTx.id
      }
    };

    const {data} = await arweave.api.post('arql', successorsQuery);
    const successors = data === '' ? [] : data;

    for(let i = 0, j = successors.length; i < j; i++) {
      const tx = await arweave.transactions.get(successors[i]);
      if(this.validateNextTx(contract, state, tx)) {
        return tx;
      }
    }

    return;
  }

  public async getTxState(tx: Transaction) {
    if(!tx) return;
    if(await this.getTag(tx, 'Type') === 'contract') {
      return tx.get('data', {decode: true, string: true});
    }

    return JSON.parse(tx.get('data', {decode: true, string: true}))['newState'];
  }

  public async getTag(tx: Transaction, tagName: string): Promise<string> {
    if(this.tags.has(tagName)) {
      return this.tags.get(tagName);
    }

    // @ts-ignore
    const tags: Tag[] = tx.get('tags');
    for(let i = 0, j = tags.length; i < j; i++) {
      this.tags.set(tags[i].get('name', {decode: true, string: true}), tags[i].get('value', {decode: true, string: true}));
    }

    if(this.tags.has(tagName)) {
      return this.tags.get(tagName);
    }
    return;
  }

  public async validateNextTx(contract: ContractInterface, state: any, nextTx: Transaction) {
    let struct = JSON.parse(nextTx.get('data', {decode: true, string: true}));
    return (
      contract.contractSrc,
      struct.input,
      state,
      await arweave.wallets.ownerToAddress(nextTx.owner)
    );
  }
}