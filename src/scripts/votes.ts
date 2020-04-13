import $ from 'cash-dom';
import * as M from 'materialize-css';
import {accounts} from "./accounts";
import {links} from "./links";
import {App, arweave} from "./app";
import {spawn} from "threads";
import {Pool} from "threads/dist";
import "threads/register";

export class Votes {
  private votes = [];
  private votesByLinkId = new Map();

  init() {
    this.events();
  }

  async getAllVotes() {
    const queryVotes = {
      op: 'and',
      expr1: {
        op: 'equals',
        expr1: 'App-Name',
        expr2: App.appName
      },
      expr2: {
        op: 'equals',
        expr1: 'Type',
        expr2: 'vote',
      }
    };

    console.log(`fetching all votes...`);
    const res = await arweave.api.post(`arql`, queryVotes);
    console.log('finished fetching votes');

    let votes = [];
    if(res.data.length) {
      votes = await Promise.all(res.data.map(async id => {
        if(window.localStorage.getItem(id)) {
          return JSON.parse(window.localStorage.getItem(id));
        }

        let txRow = {};
        const tx = await arweave.transactions.get(id);

        // @ts-ignore
        tx.get('tags').forEach(tag => {
          let key = tag.get('name', { decode: true, string: true });
          let value = tag.get('value', { decode: true, string: true });
          txRow[key.toLowerCase()] = value
        });

        txRow['id'] = id;
        txRow['from'] = await arweave.wallets.ownerToAddress(tx.owner);

        window.localStorage.setItem(id, JSON.stringify(txRow));
        return txRow;
      }));
    }

    for(let i = 0, j = this.votes.length; i < j; i++) {
      this.votesByLinkId.set(this.votes[i]['link-id'], this.votes[i].votes);
    }

    return this.votes;
  }

  async getVotesByLinkId(linkId) {
    const vote = this.votesByLinkId.get(linkId) || [];

    return vote;
  }

  async publish(linkId) {
    if(!accounts.isLoggedIn) {
      accounts.showLogin();
      return M.toast({html: 'Login to vote.'});
    }

    // Validate that this user hasn't voted yet.
    const link = links.getDataById.get(linkId);
    for(let k = 0, l = link.votes.length; k < l; k++) {
      const vote = link.votes[k];

      if(vote === accounts.getWalletAddress) {
        return M.toast({html: 'You already voted for this link.'});
      }
    }

    const tx = await arweave.createTransaction({ data: 'voteup' }, accounts.getWallet);

    tx.addTag('App-Name', App.appName);
    tx.addTag('App-Version', App.appVersion);
    // @ts-ignore
    tx.addTag('Unix-Time', Math.round((new Date()).getTime() / 1000));
    tx.addTag('Type', 'vote');
    tx.addTag('Link-Id', linkId);

    await arweave.transactions.sign(tx, accounts.getWallet);
    console.log(tx.id);
    await arweave.transactions.post(tx);

    links.addVote(accounts.getWalletAddress, linkId);

    return M.toast({html: 'Vote sent. Thank you.'});
  }

  events() {
    $('.js-app-list').on('click', '.js-vote', e => {
      e.preventDefault();

      this.publish($(e.target).parents('.collection-item').first().data('id')).catch(console.log);
    });
  }
}
export const votes = new Votes();
