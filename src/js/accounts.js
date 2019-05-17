class Accounts {
    constructor() {
        this._loginOpen = false;
    }

    init() {
        this._events();
    }

    async getUsername(address = this.walletAddress) {
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
                                expr2: address
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

        if(txs.data.length === 0)
            return address;

        const tx = await arweave.transactions.get((txs.data)[0]);

        return tx.get('data', {decode: true, string: true})
    }

    showLogin() {
        this._loginOpen = true;
        $('#modal-login').modal('open');
    }

    _login(ev) {
        const fileReader = new FileReader();
        fileReader.onload = async e => {
            this.loggedIn = true;
            this.wallet = JSON.parse(e.target.result);

            const address = await arweave.wallets.jwkToAddress(this.wallet);
            this.walletAddress = address;

            this.walletUser = await this.getUsername(address);

            $('.js-logged-in').removeClass('hide').children('strong').text(this.walletUser);
            $('.js-logged-out').addClass('hide');

            $('#modal-login').modal('close');
            app.hashChanged();

            links.showAllLinksByAccount(address).catch(console.log);
        };
        fileReader.readAsText(ev.target.files[0]);
    }

    _containsFiles(event){
        if (event.dataTransfer.types) {
            for (var i=0; i<event.dataTransfer.types.length; i++) {
                if (event.dataTransfer.types[i] == "Files") {
                    return true;
                }
            }
        }

        return false;
    }

    _events() {
        $('#keyfile').on('change', e => {
            this._login(e);
        });

        $('#modal-login').modal({
            onCloseEnd: () => {
                this._loginOpen = false;
            }
        });

        document.addEventListener('dragenter', e => {
            e.preventDefault();

            if(!this._loginOpen && !this.loggedIn && this._containsFiles(e)) {
                this.showLogin();
            }
        }, false);
    }
}
const accounts = new Accounts();