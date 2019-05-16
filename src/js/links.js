String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

class Links {
    static CATEGORIES() {
        return [
            "games",
            "gambling",
            "social",
            "finance",
            "development",
            "media",
            "wallet",
            "stores",
            "security",
            "governance",
            "property",
            "storage",
            "identity",
            "energy",
            "health"
        ];
    }

    constructor() {
        this._data = [];
        this._dataById = new Map();
        this._appIcon;

        this._categories = new Set();

        for(let i = 0, j = Links.CATEGORIES().length; i < j; i++) {
            this._categories.add(Links.CATEGORIES()[i]);
        }
    }

    init() {
        this._events();
        this.showAll().catch(console.log);
        this._showCategories();
    }

    async getAll() {
        const queryLinks = {
            op: 'and',
            expr1: {
                op: 'equals',
                expr1: 'App-Name',
                expr2: app.appName
            },
            expr2: {
                op: 'equals',
                expr1: 'Type',
                expr2: 'publish'
            }
        };

        console.log('fetching published apps...');
        const res = await arweave.api.post(`arql`, queryLinks);
        console.log('finished fetching published apps.');

        this._data = [];
        if(res.data.length) {
            this._data = await Promise.all(res.data.map(async function(id) {
                let txRow = {};
                var tx = await arweave.transactions.get(id);

                tx.get('tags').forEach(tag => {
                    let key = tag.get('name', { decode: true, string: true });
                    let value = tag.get('value', { decode: true, string: true });
                    txRow[key.toLowerCase()] = value
                });

                const jsonData = tx.get('data', {decode: true, string: true});
                const data = JSON.parse(jsonData);

                txRow['id'] = id;
                txRow['appIcon'] = data.appIcon;
                txRow['from'] = await arweave.wallets.ownerToAddress(tx.owner);
                txRow['title'] = data.title;
                txRow['linkId'] = data.linkId;
                txRow['description'] = data.description;

                txRow['votes'] = await votes.getAllByLinkId(id);

                return txRow;
            }));
        }

        this._dataById = new Map();
        if(this._data.length) {
            // Remove duplicates (older versions), sort by time
            this._data.sort((a, b) => b['unix-time'] - a['unix-time']);

            const tmp = [];
            const tmpSet = new Set();
            for(let i = 0, j = this._data.length; i < j; i++) {
                if(!tmpSet.has(`${this._data[i].title}-${this._data[i].from}`)) {
                    tmp.push(this._data[i]);
                    tmpSet.add(`${this._data[i].title}-${this._data[i].from}`);
                }
            }
            this._data = tmp;

            // Last sort by votes
            this._data.sort((a, b) => a.votes.length < b.votes.length? 1 : a.votes.length > b.votes.length? -1 : 0);

            for(let i = 0, j = this._data.length; i < j; i++) {
                this._dataById.set(this._data[i].id, this._data[i]);
            }
        }

        return this._data;
    }

    async getAllLinksByAccount(address) {
        const query = {
            op: 'and',
            expr1: {
                op: 'equals',
                expr1: 'from',
                expr2: address
            },
            expr2: {
                op: 'equals',
                expr1: 'Content-Type',
                expr2: 'text/html'
            }
        };
        const res = await arweave.api.post('arql', query);

        return res.data;
    }

    async showAll() {
        await this.getAll();

        $('.js-preload-app-list').remove();

        this._dataById.forEach(async link => {
            if(links._categories.has(link.category)) {
                let $collection;
                if(!$(`div[data-category="${link.category}"]`).length) {
                    $collection = $('<ul class="collection"></ul>');
                    $('.js-app-list').append($(`<div data-category="${link.category}" class="col s12 l6"><h5>${link.category.toUpperCase()}</h5></div>`).append($collection));
                } else {
                    $collection = $(`div[data-category="${link.category}"]`).find('.collection');
                }

                const username = await accounts.getUsername(link.from);

                $collection.append(`
                    <li class="collection-item avatar" data-id="${link.id}">
                        <a href="https://arweave.net/${link.linkId}" target="_blank" rel="nofollow">
                            <img src="${link.appIcon}" alt="${link.title}">
                            <div class="title"><span style="max-width: 100px; float: left;" class="truncate">${username}</span> <span style="margin-left: 5px">/ ${link.title}</span></div>
                            <small>${link.description}</small>
                        </a>
    
                        <div class="secondary-content center-align">
                            <a href="#" class="js-vote material-icons">arrow_drop_up</a>
                            <span class="app-votes">${link.votes.length}</span>
                        </div>
                    </li>`);
            }

            return true;
        });
    }

    async showAllLinksByAccount(address) {
        const linksId = await this.getAllLinksByAccount(address);

        let options =[];
        if(linksId && linksId.length) {
            options = await Promise.all(linksId.map(async linkId => {
                let txRow = {};
                const tx = await arweave.transactions.get(linkId);

                tx.get('tags').forEach(tag => {
                    let key = tag.get('name', { decode: true, string: true });
                    let value = tag.get('value', { decode: true, string: true });
                    txRow[key.toLowerCase()] = value
                });

                const data = tx.get('data', {decode: true, string: true});

                txRow['id'] = linkId;
                txRow['data'] = data;
                txRow['from'] = await arweave.wallets.ownerToAddress(tx.owner);

                return txRow;
            }));
        }

        const optionsHtml = ['<option disabled selected>Select your permaweb</option>'];
        options.forEach((option) => {
            let title = option.data.match(/<title[^>]*>([^<]+)<\/title>/);
            if(title && title.length > 1) {
                title = title[1];
            } else {
                title = "untitledlink";
            }
            optionsHtml.push(`<option value="${option.id}">${title} (${option.id})</option>`);
        });

        $('#link-link').html(optionsHtml);
        $('select').formSelect();
    }

    async publish() {
        if(!accounts.loggedIn) {
            accounts.showLogin();
            return M.toast({html: 'Login and then hit publish again.'});
        }

        // Validate that all the fields are valid and filled
        const title = this._htmlToTxt($.trim("" + $('#link-title').val()));
        const category = this._htmlToTxt($.trim("" + $('#link-category').val())).toLowerCase();
        const linkId = this._htmlToTxt($.trim("" + $('#link-link').val()));
        const description = this._htmlToTxt($.trim("" + $('#link-description').val()));

        if(title.length < 3 || title.length > 25) {
            return M.toast({html: 'The app title must be between 3 and 25 characters.'});
        }

        if(!this._categories.has(category)) {
            return M.toast({html: 'Invalid category.'});
        }

        if(description.length < 10 || description.length > 140) {
            return M.toast({html: 'The description must be between 10 and 140 characters.'});
        }

        if(/*!this.appImage || !this.appImage.length ||*/ !this._appIcon || !this._appIcon.length) {
            return M.toast({html: 'Permaweb icon is required.'});
        }

        if(linkId.length !== 43) {
            return M.toast({html: 'Invalid App ID.'});
        }

        const data = {
            title,
            category,
            linkId,
            appIcon: this._appIcon,
            description
        };

        const tx = await arweave.createTransaction({ data: JSON.stringify(data) }, accounts.wallet);

        tx.addTag('App-Name', app.appName);
        tx.addTag('App-Version', app.appVersion);
        tx.addTag('Unix-Time', Math.round((new Date()).getTime() / 1000));
        tx.addTag('Type', 'publish');
        tx.addTag('Category', category);

        await arweave.transactions.sign(tx, accounts.wallet);
        console.log(tx.id);
        await arweave.transactions.post(tx);

        return M.toast({html: 'App sent, will be available after one block.'});
    }

    addVote(address, id) {
        this._dataById.set(id, this._dataById.get(id).votes.push({from: address}));
        for(let i = 0, j = this._data.length; i < j; i++) {
            if(this._data[i].id === id) {
                this._data[i].votes.push({from: address});
            }
        }
    }

    _imageConvert(file) {
        const reader = new FileReader();
        reader.onload = img => {
            $(`#link-icon`).html(`<img src="${img.target.result}" width="80" height="80" />`);
            this._appIcon = img.target.result;
        };
        reader.readAsDataURL(file);
    }

    _showCategories() {
        const optionsHtml = ['<option value="" disabled selected>Choose a category</option>'];
        Links.CATEGORIES().forEach(category => {
            optionsHtml.push(`<option>${category.capitalize()}</option>`);
        });
        $('#link-category').html(optionsHtml);
        $('select').formSelect();
    }

    _htmlToTxt(str) {
        return $(`<div>${str}</div>`).text();
    }

    _events() {
        $('#link-title, #link-description').characterCounter();

        $('#link-icon').on('click', e => {
            e.preventDefault();
            $('#imgfile').trigger('click');
        });

        $('#imgfile').on('change', (e) => {
            this._imageConvert(e.target.files[0]);
        });

        $('#publish-form').on('submit', e => {
            e.preventDefault();

            this.publish();
        });

        $('.js-go-publish').on('click', e => {
            if(!accounts.loggedIn) {
                M.toast({html: 'Login to publish a link'});
                accounts.showLogin();
            }
        });
    }


    get data() {
        return this._data;
    }

    get dataById() {
        return this._dataById;
    }
}
const links = new Links();