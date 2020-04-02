import {Utils} from "../utils";
import axios from 'axios';
import {App, arweave} from "../app";
import {ILink} from "../interfaces/iLink";
import $ from 'cash-dom';

export class VotesModel {
  private threads = 8;

  constructor(threads = 8) {
    this.threads = threads;
  }

  async sortByVotes(data) {
    return data.sort((a, b) => a.votes.length < b.votes.length? 1 : a.votes.length > b.votes.length? -1 : 0);
  }

  async createDataById(data) {
    const dataById = new Map();
    for(let i = 0, j = data.length; i < j; i++) {
      dataById.set(data[i].id, data[i]);
    }

    return dataById;
  }

  async getVotesByLinkId(linkId: string): Promise<string[]> {
      const transactions = await arweave.arql({
          op: 'and',
          expr1: {
              op: 'equals',
              expr1: 'App-Name',
              expr2: App.appName
          },
          expr2: {
              op: 'and',
              expr1: {
                  op: 'equals',
                  expr1: 'Type',
                  expr2: 'vote'
              },
              expr2: {
                  op: 'equals',
                  expr1: 'App-Link',
                  expr2: linkId
              }
          }
      });

      return transactions;
  }

  async getTransactionDetails(transactions: string[]): Promise<ILink[]> {
    return new Promise(resolve => {
      const total = transactions.length;
      const toLoad = total > this.threads ? this.threads : total;
      let current = 0;
      let data = [];

      const go = async(index) => {
        if(total === index) {
          return;
        }

        const id = transactions[index];
        let storedData = window.localStorage.getItem(`${App.appVersion}-${id}`);
        if(storedData) {
          data.push(JSON.parse(storedData));
        } else {
          try {
            const txRow = await this.getTransactionDetailsById(id);
            data.push(txRow);

            try {
              window.localStorage.setItem(`${App.appVersion}-${id}`, JSON.stringify(txRow));
            } catch (e) {}
          } catch (e) {
            console.log(e);
          }
        }

        if(current === total) {
          return resolve(data);
        }
        return go(++current);
      };

      current = toLoad;
      for(let i = 0; i < toLoad; i++) {
        go(i).catch(console.log);
      }
    });
  }

  async getTransactionDetailsById(txId: string): Promise<any> {
    // @ts-ignore
    let txRow = {};

    const res = await axios(`https://arweave.net/tx/${txId}`);
    const tx = res.data;

    tx.tags.forEach(tag => {
      const key = Utils.stripTags(atob(tag.name));
      txRow[key.toLowerCase().replace(/-([a-z])/g, (g) => g[1].toUpperCase())] = Utils.stripTags(atob(tag.value));
    });

    return txRow;
  }
}