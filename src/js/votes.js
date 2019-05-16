class Votes {
    init() {
        this._events();
    }

    async getAllByLinkId(linkId) {
        const queryVotes = {
            op: 'and',
            expr1: {
                op: 'and',
                expr1: {
                    op: 'equals',
                    expr1: 'App-Name',
                    expr2: app.appName
                },
                expr2: {
                    op: 'equals',
                    expr1: 'Type',
                    expr2: 'vote',
                }
            },
            expr2: {
                op: 'and',
                expr1: {
                    op: 'equals',
                    expr1: 'Link-Id',
                    expr2: linkId
                },
                expr2: {
                    op: 'equals',
                    expr1: 'Type',
                    expr2: 'vote'
                }
            }
        };

        console.log(`fetching votes for app ${linkId}...`);
        const res = await arweave.api.post(`arql`, queryVotes);
        console.log(`finished fetching votes for app ${linkId}`);

        console.log(app.appName, linkId, res);

        let votes = [];
        if(res.data.length) {
            votes = await Promise.all(res.data.map(async id => {
                let txRow = {};
                const tx = await arweave.transactions.get(id);

                tx.get('tags').forEach(tag => {
                    let key = tag.get('name', { decode: true, string: true });
                    let value = tag.get('value', { decode: true, string: true });
                    txRow[key.toLowerCase()] = value
                });

                txRow['id'] = id;
                txRow['from'] = await arweave.wallets.ownerToAddress(tx.owner);

                return txRow;
            }))
        }

        console.log(votes);

        return votes;
    }

    async publish(linkId) {
        if(!accounts.loggedIn) {
            accounts.showLogin();
            return M.toast({html: 'Login to vote.'});
        }

        // Validate that this user hasn't voted yet.
        const link = links.dataById.get(linkId);
        for(let k = 0, l = link.votes.length; k < l; k++) {
            const vote = link.votes[k];

            if(vote.from === accounts.walletAddress) {
                return M.toast({html: 'You already voted for this link.'});
            }
        }

        const tx = await arweave.createTransaction({ data: 'voteup' }, accounts.wallet);

        tx.addTag('App-Name', app.appName);
        tx.addTag('App-Version', app.appVersion);
        tx.addTag('Unix-Time', Math.round((new Date()).getTime() / 1000));
        tx.addTag('Type', 'vote');
        tx.addTag('Link-Id', linkId);

        await arweave.transactions.sign(tx, accounts.wallet);
        console.log(tx.id);
        await arweave.transactions.post(tx);

        links.addVote(accounts.walletAddress, linkId);

        return M.toast({html: 'Vote sent. Thank you.'});
    }

    _events() {
        $('.js-app-list').on('click', '.js-vote', e => {
            e.preventDefault();

            this.publish($(e.target).parents('.collection-item').first().data('id')).catch(console.log);
        });
    }
}
const votes = new Votes();