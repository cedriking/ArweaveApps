class Accounts {
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
            return this.walletAddress;

        const tx = await arweave.transactions.get((txs.data)[0]);

        return tx.get('data', {decode: true, string: true})
    }

    showLogin() {
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

    _events() {
        $('#keyfile').on('change', e => {
            this._login(e);
        });
    }
}
const accounts = new Accounts();