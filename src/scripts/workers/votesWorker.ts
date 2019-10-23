import {expose} from 'threads/worker';
import Transaction from "arweave/web/lib/transaction";
import {Utils} from "../utils";

const votesWorker = {
  getVote: async (tx: Transaction) => {
    let txRow = {};

    tx.tags.forEach(tag => {
      const key = atob(tag.name);
      txRow[key.toLowerCase()] = atob(tag.value);
    });

    return txRow;
  },
  cleanVotes: async (votes: {'link-id': string, from: string}[]) => {
    const newVotes = [];
    for(let i = 0, j = votes.length; i < j; i++) {
      const vote = votes[i];
      if(vote['link-id'] === undefined) continue;

      const voteIndex = newVotes.findIndex(v => v['link-id'] === vote['link-id']);
      if(voteIndex >= 0) {
        let hasUserVoted = newVotes[voteIndex].votes.filter(v => v === vote.from);
        if(hasUserVoted.length) continue;

        newVotes[voteIndex].votes.push(vote.from);
      } else {
        newVotes.push({'link-id': vote['link-id'], votes: [vote.from]});
      }
    }

    return newVotes;
  },
  setVotesToLinkId: async (votes: {'link-id': string, from: string, votes: string[]}[]) => {
    const votesByLinkId = new Map();
    for(let i = 0, j = votes.length; i < j; i++) {
      votesByLinkId.set(votes[i]['link-id'], votes[i].votes);
    }

    return votes;
  }
};

export type VotesWorker = typeof votesWorker;
expose(votesWorker);
