import $ from 'cash-dom';
import {app, arweave} from "./app";
import {links} from "./links";

class Accounts {
  private data = new Map();
  private loginOpen = false;
  private walletAddress;
  private loggedIn;
  private wallet;
  private walletUser;

  public get isLoggedIn(): boolean {
    return this.loggedIn;
  }

  public get getWallet() {
    return this.wallet;
  }

  public get getWalletAddress() {
    return this.walletAddress;
  }

  init() {
    this.events();
  }

  async getUsername(address = this.walletAddress) {
    if(this.data.has(address)) {
      return this.data.get(address);
    }

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

    const username = tx.get('data', {decode: true, string: true});

    this.data.set(address, username);

    return username;
  }

  showLogin() {
    this.loginOpen = true;
    // @ts-ignore
    $('#modal-login').modal('open');
  }

  private login(ev) {
    const fileReader = new FileReader();
    fileReader.onload = async e => {
      this.loggedIn = true;
      // @ts-ignore
      this.wallet = JSON.parse(e.target.result);

      const address = await arweave.wallets.jwkToAddress(this.wallet);
      this.walletAddress = address;

      this.walletUser = await this.getUsername(address);

      $('.js-logged-in').removeClass('hide').children('strong').text(this.walletUser);
      $('.js-logged-out').addClass('hide');

      // @ts-ignore
      $('#modal-login').modal('close');
      app.hashChanged();

      links.showAllLinksByAccount(address).catch(console.log);
    };
    fileReader.readAsText(ev.target.files[0]);
  }

  private containsFiles(event){
    if (event.dataTransfer.types) {
      for (var i=0; i<event.dataTransfer.types.length; i++) {
        if (event.dataTransfer.types[i] == "Files") {
          return true;
        }
      }
    }

    return false;
  }

  private events() {
    document.getElementById('keyfile').onchange = e => {
      this.login(e);
    };

    M.Modal.init($('#modal-login')[0], {
      onCloseEnd: () => this.loginOpen = false
    });

    document.addEventListener('dragenter', e => {
      e.preventDefault();

      if(!this.loginOpen && !this.loggedIn && this.containsFiles(e)) {
        this.showLogin();
      }
    }, false);
  }
}

export const accounts = new Accounts();