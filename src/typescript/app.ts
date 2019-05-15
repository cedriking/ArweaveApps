declare const $, Arweave, Materialize;
const arweave = Arweave.init({host: 'arweave.net', port: 443, protocol: 'https'});

async function get_name(addr) {
    let get_name_query =
        {
            op: 'and',
            expr1:
                {
                    op: 'equals',
                    expr1: 'App-Name',
                    expr2: 'arweave-id'
                },
            expr2:
                {
                    op: 'and',
                    expr1:
                        {
                            op: 'equals',
                            expr1: 'from',
                            expr2: addr
                        },
                    expr2:
                        {
                            op: 'equals',
                            expr1: 'Type',
                            expr2: 'name'
                        }
                }
        };

    const txs = await arweave.api.post(`arql`, get_name_query);

    if(txs.data.length == 0)
        return addr;

    const tx = await arweave.transactions.get((txs.data)[0]);

    return tx.get('data', {decode: true, string: true})

}

class PublishApp {
    activeAppImage: 'image'|'icon';
    appImage: string;
    appIcon: string;
    appCategories = [
        "Games",
        "Gambling",
        "Social",
        "Finance",
        "High risk",
        "Exchanges",
        "Development",
        "Media",
        "Wallet",
        "Stores",
        "Security",
        "Governance",
        "Property",
        "Storage",
        "Identity",
        "Energy",
        "Health",
        "Insurance"
    ];

    init() {
        this.events();
    }

    private events() {
        $('#app-title, #app-description').characterCounter();

        $('#app-image').click(() => {
            this.activeAppImage = 'image';
            $('#imgfile').click();
        });

        $('#app-icon').click(() => {
            this.activeAppImage = 'icon';
            $('#imgfile').click();
        });

        $('#imgfile').change((e) => {
            this.imageConvert(e.target.files[0]);
        });

        $('#publish-form').submit(e => {
            e.preventDefault();

            this.publish();
        });
    }

    private imageConvert(file) {
        const reader = new FileReader();
        reader.onload = (img: any) => {
            $(`#app-${this.activeAppImage}`).attr('src', img.target.result);
            if(this.activeAppImage === 'image') {
                this.appImage = img.target.result;
            } else {
                this.appIcon = img.target.result;
            }
        };
        reader.readAsDataURL(file);
    }

    async publishVote(appId: string) {
        if(!app.loggedIn) {
            $('#modal-login').modal('open');
            return alert('Login to vote.');
        }

        // Validate that this user hasn't voted yet.
        let appIndex = -1;
        for(let i = 0, j = db.apps.length; i < j; i++) {
            const app = db.apps[i];

            if(app.appId = appId) {
                appIndex = i;
                for(let k = 0, l = app.votes.length; k < l; k++) {
                    const vote = app.votes[k];

                    if(vote.from === app.walletAddress) {
                        return alert('You already voted for this link.');
                    }
                }
            }
        }

        const tx = await arweave.createTransaction({ data: 'voteup' }, app.wallet);

        tx.addTag('App-Name', App.appName);
        tx.addTag('App-Version', App.appVersion);
        tx.addTag('Unix-Time', Math.round((new Date()).getTime() / 1000));
        tx.addTag('Type', 'vote');
        tx.addTag('App-Id', appId);

        await arweave.transactions.sign(tx, app.wallet);
        console.log(tx.id);
        await arweave.transactions.post(tx);

        db.apps[appIndex].votes.push({from: app.walletAddress});

        return alert('Vote sent. Thank you.');
    }

    private async publish() {
        if(!app.loggedIn) {
            $('#modal-login').modal('open');
            return alert('Login and then hit publish again.');
        }

        // Validate that all the fields are valid and filled
        const title = this.htmlToTxt($.trim($('#app-title').val()));
        const category = this.htmlToTxt($.trim($('#app-category').val()));
        const appId = this.htmlToTxt($.trim($('#app-link').val()));
        const description = this.htmlToTxt($.trim($('#app-description').val()));

        for(let i = 0, j = db.apps.length; i < j; i++) {
            const app = db.apps[i];

            console.log(app.title.toLowerCase(), title.toLowerCase());
            if(app.title.toLowerCase() === title.toLowerCase()) {
                return alert('This app is already published');
            }
        }

        if(title.length < 3 || title.length > 25) {
            return alert('The app title must be between 3 and 25 characters.');
        }

        if($.inArray(category, this.appCategories) === -1) {
            return alert('Invalid category.');
        }

        if(description.length < 10 || description.length > 140) {
            return alert('The description must be between 10 and 140 characters.');
        }

        if(/*!this.appImage || !this.appImage.length ||*/ !this.appIcon || !this.appIcon.length) {
            return alert('Permaweb icon is required.');
        }

        if(appId.length !== 43) {
            return alert('Invalid App ID.');
        }

        const data = {
            title,
            category,
            appId,
            appIcon: this.appIcon,
            description
        };

        const tx = await arweave.createTransaction({ data: JSON.stringify(data) }, app.wallet);

        tx.addTag('App-Name', App.appName);
        tx.addTag('App-Version', App.appVersion);
        tx.addTag('Unix-Time', Math.round((new Date()).getTime() / 1000));
        tx.addTag('Type', 'publish');
        tx.addTag('Category', category);

        await arweave.transactions.sign(tx, app.wallet);
        console.log(tx.id);
        //await arweave.transactions.post(tx);

        return alert('App sent, will be available after one block.');
    }

    private htmlToTxt(str) {
        return $(`<div>${str}</div>`).text();
    }
}
const publishApp = new PublishApp();

class DB {
    apps = [];

    init() {
        this.getAllApps().catch(console.log);
    }

    async getAllApps() {
        const queryApps = {
            op: 'and',
            expr1: {
                op: 'equals',
                expr1: 'App-Name',
                expr2: 'arweaveapps'
            },
            expr2: {
                op: 'equals',
                expr1: 'Type',
                expr2: 'publish'
            }
        };

        console.log('fetching published apps...');
        const res = await arweave.api.post(`arql`, queryApps);
        console.log('finished fetching published apps.');

        this.apps = [];
        if(res.data.length) {
            this.apps = await Promise.all(res.data.map(async function(id) {
                let txRow = {};
                var tx = await arweave.transactions.get(id);

                tx.get('tags').forEach(tag => {
                    let key = tag.get('name', { decode: true, string: true });
                    let value = tag.get('value', { decode: true, string: true });
                    txRow[key] = value
                });

                const jsonData = tx.get('data', {decode: true, string: true});
                const data = JSON.parse(jsonData);

                txRow['id'] = id;
                txRow['icon'] = data.appIcon;
                txRow['from'] = await arweave.wallets.ownerToAddress(tx.owner);
                txRow['title'] = data.title;
                txRow['appId'] = data.appId;
                txRow['description'] = data.description;

                const queryVotes = {
                    op: 'and',
                    expr1: {
                        op: 'and',
                        expr1: {
                            op: 'equals',
                            expr1: 'App-Name',
                            expr2: 'arweaveapps'
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
                            expr1: 'App-Id',
                            expr2: data.appId
                        },
                        expr2: {
                            op: 'equals',
                            expr1: 'Type',
                            expr2: 'vote'
                        }
                    }
                };

                console.log(`fetching votes for app ${data.title} (${id})...`);
                const res = await arweave.api.post(`arql`, queryVotes);
                console.log(`finished fetching votes for app ${data.title} (${id})`);

                let votes = [];
                if(res.data.length) {
                    votes = await Promise.all(res.data.map(async function(id) {
                        let txRow = {};
                        var tx = await arweave.transactions.get(id);

                        tx.get('tags').forEach(tag => {
                            let key = tag.get('name', { decode: true, string: true });
                            let value = tag.get('value', { decode: true, string: true });
                            txRow[key] = value
                        });

                        txRow['id'] = id;
                        txRow['from'] = await arweave.wallets.ownerToAddress(tx.owner);

                        return txRow;
                    }))
                }

                txRow['votes'] = votes;

                return txRow;
            }));
        }

        if(this.apps.length) {
            // Sort by date and by votes
            this.apps.sort((a, b) => a['Unix-Time'] < b['Unix-Time']? 1 : a['Unix-Time'] > b['Unix-Time']? -1 : 0);
            this.apps.sort((a, b) => a.votes.length < b.votes.length? 1 : a.votes.length > b.votes.length? -1 : 0);

            this.apps.forEach(app => {
                if(app.id === 'VzZVguWilkpN6bCFYJxJOt33N8H3qGmfdHBkkeJAIkg') return true;

                if($.inArray(app.Category, publishApp.appCategories) !== -1) {
                    let $collection;
                    if(!$(`div[data-category="${app.Category}"]`).length) {
                        $collection = $('<ul class="collection"></ul>');
                        $('.js-app-list').append($(`<div data-category="${app.Category}" class="col s12 m6 l4"><h5>${app.Category.toUpperCase()}</h5></div>`).append($collection));
                    } else {
                        $collection = $(`div[data-category="${app.Category}"]`).find('.collection');
                    }

                    $collection.append(`
                        <li class="collection-item avatar" data-app="${app.appId}" data-id="${app.id}">
                            <a href="https://arweave.net/${app.appId}" target="_blank" rel="nofollow">
                                <img src="${app.icon}" alt="${app.title}">
                                <span class="title">${app.title}</span>
                                <small>${app.description}</small>
                            </a>

                            <div class="secondary-content center-align">
                                <a href="#" class="js-vote material-icons">arrow_drop_up</a>
                                <span class="app-votes">${app.votes.length}</span>
                            </div>
                        </li>`);
                }
            });
        }

        return this.apps;
    }
}
const db = new DB();

class App {
    static appName = 'arweaveapps';
    static appVersion = '0.0.1';

    walletAddress;
    walletUser;
    wallet;
    loggedIn = false;

    constructor() {
        window.onhashchange = this.hashChanged;
    }

    init() {
        db.init();
        publishApp.init();

        this.hashChanged();
        this.events();
    }

    private events() {
        $('#keyfile').change(e => {
            this.login(e);
        });

        $('header').on('click', '.btn-small', e => {
            $('.btn-small').blur();
        }); // little hack to remove the focus color on the publish app button

        $('.js-app-list').on('click', '.js-vote', e => {
            e.preventDefault();

            publishApp.publishVote($(e.target).parents('.collection-item').first().data('app'));
        });
    }

    private hashChanged() {
        let page: string = 'home';

        if(window.location.hash) {
            const newPage = window.location.hash.substring(1).split('?')[0];

            if(newPage === 'logout') {
                window.location.href = window.location.href.split('#')[0];
            } else if(newPage === 'home' || newPage === 'publish' || newPage === 'view') {
                page = newPage;
            }
        }

        $('[id^="page-"]').hide();
        $(`#page-${page}`).show();

        $('.js-page-active').removeClass('active');
        $(`.js-page-active[data-page=${page}]`).addClass('active');
    }

    private login(ev) {
        const fileReader = new FileReader();
        fileReader.onload = (e: any) => {
            this.loggedIn = true;
            this.wallet = JSON.parse(e.target.result);

            arweave.wallets.jwkToAddress(this.wallet).then(address => {
                this.walletAddress = address;

                get_name(address).then(username => {
                    this.walletUser = username;

                    $('.account-box').removeClass('hide').children('strong').text(username);
                });
            });

            $('#modal-login').modal('close');

        };
        fileReader.readAsText(ev.target.files[0]);
    }
}
const app = new App();

$(document).ready(() => {
    $('.modal').modal();
    $('select').formSelect();

    app.init();
});