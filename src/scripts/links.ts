import $ from 'cash-dom';
import * as M from 'materialize-css';
import hashicon from 'hashicon';
import {App, arweave} from "./app";
import {accounts} from "./accounts";
import {Utils} from "./utils";
import {Pool, spawn} from 'threads';
import {LinksWorker} from "./workers/links";
import "threads/register";
import {worker} from "cluster";

const pool = Pool(() => spawn<LinksWorker>(new Worker("./workers/links.ts")), 8 /* optional size */);

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

  private data = [];
  private dataById = new Map();
  private appIcon = '';
  private contentLoaded = false;
  private categories = new Set();

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

  init() {
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
    const query = {
      query: `{
            transactions(tags: [{name: "App-Name", value: "arweaveapps"}, {name: "Type", value: "publish"}]) {
              id,
                votes: linkedFromTransactions(byForeignTag: "Link-Id", tags: [{name: "App-Name", value: "arweaveapps"}, {name: "Type", value: "vote"}]) {
                id
              }
            }
          }`
    };

    console.time('fetching apps');
    const res = await arweave.api.post(`arql`, query);
    console.timeEnd('fetching apps');

    this.data = [];
    const transactions = res.data.data.transactions;
    let hasPool = false;

    console.time('grabbing app details');
    for(let i = 0, j = transactions.length; i < j; i++) {
      const id = transactions[i].id;

      let storedData = window.localStorage.getItem(`${App.appVersion}-${id}`);
      if(storedData) {
        this.data.push(JSON.parse(storedData));
        continue;
      }

      hasPool = true;
      pool.queue(async linksWorker => {
        const txRow = await linksWorker.getTransactionDetailsById(id, transactions[i]);
        txRow['from'] = await arweave.wallets.ownerToAddress(txRow.from);
        this.data.push(txRow);

        try {
          window.localStorage.setItem(`${App.appVersion}-${id}`, JSON.stringify(txRow));
        } catch (e) {}
      });

    }
    if(hasPool) {
      await pool.completed();
    }
    console.timeEnd('grabbing app details');

    this.dataById = new Map();
    console.time('filtering apps');
    if(this.data.length) {
      // Remove old versions of a project and only work with the latest versions
      let tmp = [];
      const tmpSet = new Set();
      for(let i = 0, j = this.data.length; i < j; i++) {
        if(!tmpSet.has(`${this.data[i].title.toLowerCase()}-${this.data[i].from}`) && this.categories.has(this.data[i].category)) {
          this.data[i].fromUser = this.data[i].from;
          tmp.push(this.data[i]);
          tmpSet.add(`${this.data[i].title.toLowerCase()}-${this.data[i].from}`);
        }
      }

      // Sort by votes
      pool.queue(async linksWorker => {
        tmp = await linksWorker.sortByVotes(tmp);
      });
      await pool.completed();

      pool.queue(async linksWorker => {
        this.dataById = await linksWorker.createDataById(tmp);
      });
      await pool.completed();
    }
    console.timeEnd('filtering apps');

    return this.data;
  }

  async getAllLinksByAccount(address) {
    const queryHtml = {
      query: `{
        html: transactions(from: "BPr7vrFduuQqqVMu_tftxsScTKUq9ke0rx4q5C9ieQU", tags: [{name: "Content-Type", value: "text/html"}]) {
          id
        }
      }`
    };

    const queryManifest = {
      query: `{
        manifest: transactions(from: "BPr7vrFduuQqqVMu_tftxsScTKUq9ke0rx4q5C9ieQU", tags: [{name: "Content-Type", value: "application/x.arweave-manifest+json"}]) {
          id
        }
      }`
    };

    console.time('grabbing user apps');
    const res = await arweave.api.post('arql', queryManifest);
    const r = await arweave.api.post('arql', queryHtml);
    console.timeEnd('grabbing user apps');

    return r.data.data.html.concat(res.data.data.manifest).map(a => a.id);
  }

  async showAll() {
    //await votes.getAllVotes();
    console.time('getAll');
    await this.getAll();
    console.timeEnd('getAll');

    console.time('grabbing html');
    let html = '';
    pool.queue(async linksWorker => {
      html = await linksWorker.convertAllToHtml({dataById: this.dataById, categories: Links.CATEGORIES()});
    });
    await pool.completed();
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

  async showAllLinksByAccount(address) {
    const linksId = await this.getAllLinksByAccount(address);

    let options: string[] = [];

    for(let i = 0, j = linksId.length; i < j; i++) {
      options.push(`<option>${linksId[i]}</option>`);
    }

    $('#link-link').html(options.join());
    M.FormSelect.init(document.querySelectorAll('select'));
  }

  async publish() {
    if(!accounts.isLoggedIn) {
      accounts.showLogin();
      return M.toast({html: 'Login and then hit publish again.'});
    }

    // Validate that all the fields are valid and filled
    const title = this._htmlToTxt($('#link-title').val());
    const category = this._htmlToTxt($('#link-category').val()).toLowerCase();
    const linkId = this._htmlToTxt($('#link-link').val());
    const description = this._htmlToTxt($('#link-description').val());

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
      appIcon: this.appIcon,
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
    link.votes.push({from: address});
    this.dataById.set(id, link);

    for(let i = 0, j = this.data.length; i < j; i++) {
      if(this.data[i].id === id) {
        this.data[i].votes.push({from: address});
      }
    }
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

  _htmlToTxt(str) {
    return $(`<div>${str}</div>`).text();
  }

  _events() {
    M.CharacterCounter.init(document.querySelectorAll('#link-title, #link-description'));

    $('#link-icon').on('click', e => {
      e.preventDefault();
      $('#imgfile').trigger('click');
    });

    $('#imgfile').on('change', (e) => {
      // @ts-ignore
      this._imageConvert(e.target.files[0]);
    });

    $('#publish-form').on('submit', e => {
      e.preventDefault();

      this.publish();
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
