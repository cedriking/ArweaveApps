import $ from 'cash-dom';
import * as M from 'materialize-css';
import hashicon from 'hashicon';
import {App, arweave} from "./app";
import {accounts} from "./accounts";
import {Utils} from "./utils/utils";
import {LinksModel} from "./models/mLinks";
import {ILink} from "./interfaces/iLink";

export class Links {
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

  private data: ILink[] = [];
  private dataById: Map<string, ILink> = new Map();
  private appIcon: string = '';
  private contentLoaded: boolean = false;
  private categories: Set<string> = new Set();
  private linksModel = new LinksModel();

  public get getDataById() {
    return this.dataById;
  }

  public get isContentLoaded(): boolean {
    return this.contentLoaded;
  }

  constructor() {
    for(let i = 0, j = Links.CATEGORIES().length; i < j; i++) {
      this.categories.add(Links.CATEGORIES()[i]);
    }
  }

  async init() {
    await this.linksModel.init();
    this._events();
    this.showAll().catch(console.log);
    this._showCategories();
  }

  toSlug(str) {
    str = str.replace(/^\s+|\s+$/g, ''); // trim
    str = str.toLowerCase();

    // remove accents, swap ñ for n, etc
    const from = "ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;";
    const to   = "aaaaaeeeeeiiiiooooouuuunc------";
    for (let i=0, l=from.length ; i<l ; i++) {
      str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
      .replace(/\s+/g, '-') // collapse whitespace and replace by -
      .replace(/-+/g, '-'); // collapse dashes

    return str;
  }

  async getAll() {
    const transactions: string[] = await arweave.arql({
      op: 'and',
      expr1: {
        op: 'equals',
        expr1: 'App-Name',
        expr2: App.appName
      },
      expr2: {
        op: 'equals',
        expr1: 'Type',
        expr2: 'publish'
      }
    });

    console.time('grabbing app details');
    // @ts-ignore
    this.data = await this.linksModel.getTransactionDetails(transactions);
    console.timeEnd('grabbing app details');

    this.dataById = new Map();
    console.time('filtering apps');
    if(this.data.length) {
      // Remove old versions of a project and only work with the latest versions
      let tmp = [];
      const tmpSet = new Set();
      for(let i = 0, j = this.data.length; i < j; i++) {
        if(!tmpSet.has(`${this.data[i].title.toLowerCase()}-${this.data[i].from}`) && this.categories.has(this.data[i].category)) {
          tmp.push(this.data[i]);
          tmpSet.add(`${this.data[i].title.toLowerCase()}-${this.data[i].from}`);
        }
      }

      // Sort by votes
      tmp = await this.linksModel.sortByVotes(tmp);

      this.dataById = await Utils.createDataById(tmp);
    }
    console.timeEnd('filtering apps');

    return this.data;
  }

  async showAll() {
    //await votes.getAllVotes();
    console.time('getAll');
    await this.getAll();
    console.timeEnd('getAll');

    console.time('grabbing html');
    let html = await this.linksModel.convertAllToHtml({dataById: this.dataById, categories: Links.CATEGORIES()});
    console.timeEnd('grabbing html');
    $('.js-app-list').html(html);

    console.time('filling images');
    $('.empty-img').each((i, e) => {
      const hash = $(e).parents('.collection-item').first().data('linkid');
      const icon = hashicon(hash, 42);

      $(e).attr('src', icon.toDataURL("image/png"));
    });
    console.timeEnd('filling images');
    this.contentLoaded = true;
  }

  async publish() {
    if(!accounts.isLoggedIn) {
      accounts.showLogin();
      return M.toast({html: 'Please Login and then hit publish again.'});
    }

    // Validate that all the fields are valid and filled
    const title = Utils.stripTags($('#link-title').val().toString());
    const category = Utils.stripTags($('#link-category').val().toString()).toLowerCase();
    const linkId = Utils.stripTags($('#link-link').val().toString());
    const description = Utils.stripTags($('#link-description').val().toString());

    if(title.length < 3 || title.length > 25) {
      return M.toast({html: 'The app title must be between 3 and 25 characters.'});
    }

    if(!this.categories.has(category)) {
      return M.toast({html: 'Invalid category.'});
    }

    if(description.length < 10 || description.length > 140) {
      return M.toast({html: 'The description must be between 10 and 140 characters.'});
    }

    if(linkId.length !== 43) {
      return M.toast({html: 'Invalid App ID.'});
    }

    const data = {
      title,
      category,
      linkId,
      // appIcon: this.appIcon,
      description
    };

    const tx = await arweave.createTransaction({ data: JSON.stringify(data) }, accounts.getWallet);

    tx.addTag('App-Name', App.appName);
    tx.addTag('App-Version', App.appVersion);
    // @ts-ignore
    tx.addTag('Unix-Time', Math.round((new Date()).getTime() / 1000));
    tx.addTag('Type', 'publish');
    tx.addTag('Category', category);

    await arweave.transactions.sign(tx, accounts.getWallet);
    console.log(tx.id);
    await arweave.transactions.post(tx);

    return M.toast({html: 'App sent, will be available after one block.'});
  }

  addVote(address, id) {
    const link = this.dataById.get(id);
    link.votes.push(address);
    this.dataById.set(id, link);

    for(let i = 0, j = this.data.length; i < j; i++) {
      if(this.data[i].id === id) {
        this.data[i].votes.push(address);
      }
    }
  }

  private async validateLink($link): Promise<boolean> {
    const match = $link.val().toString().match(/arweave\.net\/([\d\w-]+)/);
    if(match && match.length === 2) {
      $('#link-link').val(match[1]);
    }

    const txId = $link.val().toString();
    if(txId.length !== 43) {
      $link.addClass('invalid');
      return false;
    }
    const res = await this.linksModel.getTransaction(txId);
    //console.log(res);
    
    if(!res
      || !res.contentType 
      || !(res.contentType === 'text/html' 
      || res.contentType === 'application/x.arweave-manifest+json') 
      || await arweave.wallets.ownerToAddress(res.owner) !== accounts.getWalletAddress
    ) {
      $link.addClass('invalid');
      return false;
    }

    return true;
  }

  _imageConvert(file) {
    const reader = new FileReader();
    reader.onload = img => {
      // @ts-ignore
      $(`#link-icon`).html(`<img src="${img.target.result}" width="80" height="80" />`);
      // @ts-ignore
      this.appIcon = img.target.result;
    };
    reader.readAsDataURL(file);
  }

  _showCategories() {
    const optionsHtml = ['<option value="" disabled selected>Choose a category</option>'];
    Links.CATEGORIES().forEach(category => {
      optionsHtml.push(`<option>${Utils.capitalize(category)}</option>`);
    });
    // @ts-ignore
    $('#link-category').html(optionsHtml);
    M.FormSelect.init(document.querySelectorAll('select'));
  }

  _events() {
    M.CharacterCounter.init(document.querySelectorAll('#link-title, #link-description'));

    $('#link-icon').on('click', e => {
      e.preventDefault();
      $('#imgfile').trigger('click');
    });

    $('#link-link').on('keyup', async (e) => {
      const $link = $('#link-link').removeClass('invalid');
      await this.validateLink($link);
    });

    $('#imgfile').on('change', (e) => {
      // @ts-ignore
      this._imageConvert(e.target.files[0]);
    });

    $('#publish-form').on('submit', e => {
      e.preventDefault();

      this.validateLink($('#link-link')).then(r => {
        if(r) {
          this.publish();
        } else {
          M.toast({html: 'Invalid link or you don\'t own this link.'});
        }
      }).catch(console.log);
    });

    $('.js-go-publish').on('click', e => {
      if(!accounts.isLoggedIn) {
        M.toast({html: 'Login to publish a link'});
        accounts.showLogin();
      }
    });
  }
}

export const links = new Links();
