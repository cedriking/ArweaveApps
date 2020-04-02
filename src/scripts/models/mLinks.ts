import {Utils} from "../utils";
import axios from 'axios';
import {App, arweave} from "../app";
import {ILink} from "../interfaces/iLink";
import $ from 'cash-dom';
import { VotesModel } from "./mVotes";
import { votes } from "../votes";

export class LinksModel {
  private threads = 8;

  constructor(threads = 8) {
    this.threads = threads;
  }

  async sortByVotes(data) {
    return data.sort((a, b) => a.votes.length < b.votes.length? 1 : a.votes.length > b.votes.length? -1 : 0);
  }

  async createDataById(data) {
    const dataById = new Map();
    for(let i = 0, j = data.length; i < j; i++) {
      dataById.set(data[i].id, data[i]);
    }

    return dataById;
  }

  async getUserPermawebs(options) {
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

    return optionsHtml;
  }

  async convertAllToHtml(data) {
    const {dataById, categories} = data;
    const _categories = new Map();

    let html = '';
    dataById.forEach(async link => {
      const isCategory = categories.findIndex(l => l.toLowerCase() === link.category.toLowerCase());
      if(isCategory === -1) return true;

      let collection = '';
      if(_categories.has(link.category)) {
        collection = _categories.get(link.category);
      } else {
        collection = `<div data-category="${link.category}" class="col s12"><h5 class="white-text" style="${Utils.gradients[isCategory]}; margin: 0; margin-bottom: -7px; padding: 15px 10px;">${link.category.toUpperCase()}</h5><ul class="collection">`;
      }

      const img = link.appIcon ? `<img src="${link.appIcon}" alt="${link.title}" />` : '<img class="empty-img" />';

      collection += `
                    <li class="collection-item avatar" data-id="${link.id}" data-linkid="${link.linkId}" data-repository="${Utils.toSlug(link.title)}">
                        <div class="secondary-content center-align">
                            <a href="#" class="js-vote material-icons">arrow_drop_up</a>
                            <span class="app-votes">${link.votes.length}</span>
                        </div>
                    
                        <a href="https://arweave.net/${link.linkId}" target="_blank" rel="nofollow" class="js-addy-link">
                            ${img}
                            <div class="title">${link.title}</div>
                            <small>${link.description}</small>
                        </a>
                    </li>`;

      _categories.set(link.category, collection);
    });

    const catsData = Array.from(_categories);
    catsData.sort((a, b) => a[0] > b[0]? 1 : a[0] < b[0]? -1 : 0);
    catsData.forEach(cat => {
      html += `${cat[1]}</ul></div>`;
    });

    return html;
  }

  async getTransactionDetails(transactions: string[]): Promise<ILink[]> {
    return new Promise(resolve => {
      const total = transactions.length;
      const toLoad = total > this.threads ? this.threads : total;
      let current = 0;
      let loaded = 0;
      let data = [];

      const go = async(index) => {
        if(total === index) {
          return;
        }

        const id = transactions[index];
        let storedData = window.localStorage.getItem(`${App.appVersion}-${id}`);
        if(storedData) {
          data.push(JSON.parse(storedData));
        } else {
          try {
            const txRow = await this.getTransactionDetailsById(id);
            data.push(txRow);

            try {
              window.localStorage.setItem(`${App.appVersion}-${id}`, JSON.stringify(txRow));
            } catch (e) {}
          } catch (e) {
            console.log(e);
          }
        }

        $('.jsLinksLoaded').text(` ${++loaded}/${total}`);
        if(current === total) {
          return resolve(data);
        }
        return go(++current);
      };

      current = toLoad;
      for(let i = 0; i < toLoad; i++) {
        go(i).catch(console.log);
      }
    });
  }

  async getTransactionDetailsById(txId: string): Promise<ILink> {
    // @ts-ignore
    let txRow:ILink = {};

    const res = await axios(`https://arweave.net/tx/${txId}`);
    const tx = res.data;

    const data = JSON.parse(atob(tx.data));

    txRow['title'] = Utils.stripTags(data.title);
    txRow['id'] = txId;
    txRow['appIcon'] = data.appIcon? Utils.stripTags(data.appIcon) : null;
    txRow['from'] = await arweave.wallets.ownerToAddress(tx.owner);
    txRow['fromUser'] = txRow['from'];
    txRow['linkId'] = data.linkId? Utils.stripTags(data.linkId) : null;
    txRow['description'] = Utils.stripTags(data.description);

    tx.tags.forEach(tag => {
      const key = Utils.stripTags(atob(tag.name));
      txRow[key.toLowerCase().replace(/-([a-z])/g, (g) => g[1].toUpperCase())] = Utils.stripTags(atob(tag.value));
    });

    const votesModel = new VotesModel();
    txRow.votes = await votesModel.getVotesByLinkId(txId);

    return txRow;
  }

  async getTransaction(txId: string): Promise<any> {
    let result = {};
    try {
      const res = await axios(`https://arweave.net/tx/${txId}`);
      const tx = res.data;

      result = tx;

      tx.tags.forEach(tag => {
        const key = Utils.stripTags(atob(tag.name));
        result[key.toLowerCase().replace(/-([a-z])/g, (g) => g[1].toUpperCase())] = Utils.stripTags(atob(tag.value));
      });
    } catch(e) {
      console.log(`Error getting tx tags requests for ${txId}`);
    }
    
    return result;
  }
}