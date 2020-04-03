import axios from 'axios';
import {App, arweave, db} from "../app";

export class VotesModel {
  private threads = 8;
  private tableName = 'votes';

  constructor(threads = 8, dbTableName = 'votes') {
    this.threads = threads;
    this.tableName = dbTableName;
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
                  expr1: 'Link-Id',
                  expr2: linkId
              }
          }
      });

      let current = -1;
      let result = [];
      const go = async (index = 0) => {
        if(index >= transactions.length) {
          return true;
        }

        let found = await db.findOne(this.tableName, transactions[index]);
        if(found) {
          // @ts-ignore
          result.push(found.address);
        } else {
          try {
            const res = await axios.get(`https://arweave.net/tx/${transactions[index]}`);
            if(res && res.data && res.data.owner) {
              const address = await arweave.wallets.ownerToAddress(res.data.owner);
              result.push(address);
              db.upsert(this.tableName, {id: transactions[index], address}, transactions[index]).catch(console.log);
            }
          } catch(e) {}
        }

        return go(++current);
      };

      const j = transactions.length > this.threads? this.threads : transactions.length;
      const gos = [];
      for(let i = 0; i < j; i++) {
        gos.push(go(++current));
      }
      await Promise.all(gos);

      return Array.from(new Set(result));
  }
}