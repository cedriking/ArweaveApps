import u from 'umbrellajs';
import {App} from "./app";
import {arweave} from "./arweavejs";
import {spawn, Pool} from 'threads';
import "threads/register";
import {VotesWorker} from "./workers/votesWorker";

const pool = Pool(() => spawn<VotesWorker>(new Worker("./workers/votesWorker.ts")), 8 /* optional size */);

export class Votes {
  private votes = [];
  private votesByLinkId = new Map();

  constructor() {}

  init() {
    this.events();
  }

  async getAllVotes() {
    const query = {
      op: 'and',
      expr1: {
        op: 'equals',
        expr1: 'App-Name',
        expr2: App.appName
      },
      expr2: {
        op: 'equals',
        expr1: 'Type',
        expr2: 'vote'
      }
    };

    console.log('fetching all votes...');
    const res = await arweave.api.post('arql', query);
    console.log('finished fetching votes');

    const votes = [];
    const resLength = res.data.length;
    if(resLength) {
      console.log('grabbing votes details...');
      for(let i = 0; i < resLength; i++) {
        const id = res.data[i];
        if(window.localStorage.getItem(id)) {
          return JSON.parse(window.localStorage.getItem(id));
        }

        pool.queue(async votesWorker => {
          const transaction = await arweave.transactions.get(id);
          const vote = await votesWorker.getVote(transaction);
          vote.id = id;
          vote.from = await arweave.wallets.ownerToAddress(transaction.owner);
          votes.push(vote);
        });
      }

      await pool.completed();
      console.log('Finished grabbing details');
    }

    pool.queue(async votesWorker => {
      this.votes = await votesWorker.cleanVotes(votes);
      this.votesByLinkId = await votesWorker.setVotesToLinkId(this.votes);
    });
    await pool.completed();

    return this.votes;
  }

  async getVotesByLinkId(linkId): Promise<string[]> {
    return this.votesByLinkId.get(linkId) || [];
  }

  private events() {}
}
