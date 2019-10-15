export const getVotes = function(votes) {
  const newVotes = [];
  for(let i = 0, j = votes.length; i < j; i++) {
    const vote = votes[i];

    if(vote['link-id'] === undefined) continue;

    let voteIndex = newVotes.findIndex((v) => v['link-id'] === vote['link-id']);
    if(voteIndex >= 0) {
      let hasUserVoted = newVotes[voteIndex].votes.filter(v => v === vote.from);
      if(hasUserVoted.length) continue;

      newVotes[voteIndex].votes.push(vote.from);
    } else {
      newVotes.push({'link-id': vote['link-id'], votes: [vote.from]});
    }
  }

  this.deferred().fulfill(newVotes);
}
