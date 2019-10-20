import u from 'umbrellajs';
import {App} from "./app";
import {arweave} from "./arweavejs";
import {spawn, Pool} from 'threads';
import "threads/register";
import {LinksWorker} from "./workers/linksWorker";

const pool = Pool(() => spawn<LinksWorker>(new Worker("./workers/linksWorker.ts")), 8 /* optional size */);

export class Links {
  private data = [];
  private dataById = new Map();
  private appIcon = '';
  private contentLoaded = false;
  private cats = new Set();

  constructor() {
    const categories = Links.CATEGORIES();
    for(let i = 0, j = categories.length; i < j; i++) {
      this.cats.add(categories[i]);
    }
  }

  init() {
    this.events();
    this.showAll().catch(console.log);
    this.showCategories();
  }

  private async getAll() {
    const query = {
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
    };

    console.log('fetching published dApps...');
    const res = await arweave.api.post('arql', query);
    console.log('finished fetching published dApps.');

    this.data = [];

    console.log('Grabbing dApps details...');
    const resLength = res.data.length;
    if(resLength) {
      for(let i = 0; i < resLength; i++) {
        const id = res.data[i];

        if(window.localStorage.getItem(id)) {
          this.data.push(JSON.parse(window.localStorage.getItem(id)));
          continue;
        }

        pool.queue(async linksWorker => {
          const transaction = await arweave.transactions.get(id);
          const linkD = await linksWorker.linkData(transaction);
          linkD.id = id;
          linkD.from = await arweave.wallets.ownerToAddress(transaction.owner);
          this.data.push(linkD);
        });
      }

      await pool.completed();
      console.log('Finished grabbing details...');

      console.log('Sorting by date...');
      pool.queue(async linksWorker => {
        this.data = await linksWorker.sortByDate(this.data);
        this.dataById = await linksWorker.createDataById(this.data);
      });
      await pool.completed();
      console.log('Finished sorting by date');
    }

    return this.data;

    this.dataById = new Map();
    if(this.data.length) {
      // Remove duplicates, older versions, sort by time
      //this.data = await linksWorker.sortByDate(this.data);

      const tmp = [];
      const tmpSet = new Set();

      // TODO: Add the votes, then sort by votes
      /*for(let i = 0, j = this.data.length; i < j; i++) {
        if(!tmpSet.has(`${this.data[i].title}-${this.data[i].from}`) && this.cats.has(this.data[i].category)) {
          this.data[i].votes = await votes.getVotesByLinkId(this.data[i].id);
          this.data[i].fromUser = this.data[i].from; //await accounts.getUsername(this._data[i].from);

          tmp.push(this.data[i]);
          tmpSet.add(`${this.data[i].title}-${this.data[i].from}`);
        }
      }*/

      // Sort by votes
      /*this.data = await linksWorker.sortByVotes(tmp);
      this.dataById = await linksWorker.createDataById(this.data);*/
    }

    return this.data;
  }

  private async showAll() {
    await this.getAll();

    console.log('Converting all to html...');
    let html = '';
    pool.queue(async linksWorker => {
      html = await linksWorker.convertAllToHtml({dataById: this.dataById, categories: Links.CATEGORIES()});
    });
    await pool.completed();
    u('.js-app-list').html(html);
    console.log('Finished converting all to html');

    /*const html = await linksWorker.convertAllToHtml({dataById: this.dataById, categories: Links.CATEGORIES()});
    $('.js-app-list').html(html);
    $('.empty-img').each((i, e) => {
      const hash = $(e).parents('.collection-item').first().data('linkid');

    });*/
  }
  private showCategories() {}
  private events() {}

  public static CATEGORIES() {
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
}

export const links = new Links();
