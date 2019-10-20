import {expose} from 'threads/worker';
import Transaction from "arweave/web/lib/transaction";
import {Utils} from "../utils";

const linksWorker = {
  linkData: async (tx: Transaction) => {
    let txRow = {};

    tx.tags.forEach(tag => {
      const key = atob(tag.name);
      txRow[key.toLowerCase()] = atob(tag.value);
    });

    const jsonData = atob(tx.data);
    const jData = JSON.parse(jsonData);

    txRow['appIcon'] = jData.appIcon;
    txRow['title'] = jData.title;
    txRow['linkId'] = jData.linkId;
    txRow['description'] = jData.description;

    return txRow;
  },
  sortByVotes: async (data) => data.sort((a, b) => a.votes.length < b.votes.length? 1 : a.votes.length > b.votes.length? -1 : 0),
  sortByDate: async (data) => data.sort((a, b) => +b['unix-time'] - +a['unix-time']),
  createDataById: async (data) => {
    const dataById = new Map();
    for(let i = 0, j = data.length; i < j; i++) {
      dataById.set(data[i].id, data[i]);
    }

    return dataById;
  },
  getUserPermawebs: async (options) => {
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
  },
  convertAllToHtml: async (data) => {
    const {dataById, categories} = data;
    const _categories = new Map();

    const gradients = [
      'background: #9D7AF7;\n' +
      'background: -webkit-linear-gradient(right, #9D7AF7, #1192B1);\n' +
      'background: -moz-linear-gradient(right, #9D7AF7, #1192B1);\n' +
      'background: linear-gradient(to left, #9D7AF7, #1192B1);',

      'background: #E04A82;\n' +
      'background: -webkit-linear-gradient(right, #E04A82, #5A2B57);\n' +
      'background: -moz-linear-gradient(right, #E04A82, #5A2B57);\n' +
      'background: linear-gradient(to left, #E04A82, #5A2B57);',

      'background: #005179;\n' +
      'background: -webkit-linear-gradient(right, #005179, #7A5CBA);\n' +
      'background: -moz-linear-gradient(right, #005179, #7A5CBA);\n' +
      'background: linear-gradient(to left, #005179, #7A5CBA);',

      'background: #95D5F1;\n' +
      'background: -webkit-linear-gradient(right, #95D5F1, #255A4A);\n' +
      'background: -moz-linear-gradient(right, #95D5F1, #255A4A);\n' +
      'background: linear-gradient(to left, #95D5F1, #255A4A);',

      'background: #E37A5E;\n' +
      'background: -webkit-linear-gradient(right, #E37A5E, #8907D6);\n' +
      'background: -moz-linear-gradient(right, #E37A5E, #8907D6);\n' +
      'background: linear-gradient(to left, #E37A5E, #8907D6);',

      'background: #93F74A;\n' +
      'background: -webkit-linear-gradient(right, #93F74A, #327093);\n' +
      'background: -moz-linear-gradient(right, #93F74A, #327093);\n' +
      'background: linear-gradient(to left, #93F74A, #327093);',

      'background: #6E3AF9;\n' +
      'background: -webkit-linear-gradient(right, #6E3AF9, #140E1E);\n' +
      'background: -moz-linear-gradient(right, #6E3AF9, #140E1E);\n' +
      'background: linear-gradient(to left, #6E3AF9, #140E1E);',

      'background: #E7C8C3;\n' +
      'background: -webkit-linear-gradient(right, #E7C8C3, #645427);\n' +
      'background: -moz-linear-gradient(right, #E7C8C3, #645427);\n' +
      'background: linear-gradient(to left, #E7C8C3, #645427);',

      'background: #BEB5C0;\n' +
      'background: -webkit-linear-gradient(right, #BEB5C0, #73585F);\n' +
      'background: -moz-linear-gradient(right, #BEB5C0, #73585F);\n' +
      'background: linear-gradient(to left, #BEB5C0, #73585F);',

      'background: #0F7559;\n' +
      'background: -webkit-linear-gradient(right, #0F7559, #949862);\n' +
      'background: -moz-linear-gradient(right, #0F7559, #949862);\n' +
      'background: linear-gradient(to left, #0F7559, #949862);',

      'background: #4D0F98;\n' +
      'background: -webkit-linear-gradient(right, #4D0F98, #119467);\n' +
      'background: -moz-linear-gradient(right, #4D0F98, #119467);\n' +
      'background: linear-gradient(to left, #4D0F98, #119467);',

      'background: #293171;\n' +
      'background: -webkit-linear-gradient(right, #293171, #647B82);\n' +
      'background: -moz-linear-gradient(right, #293171, #647B82);\n' +
      'background: linear-gradient(to left, #293171, #647B82);',

      'background: #F8D353;\n' +
      'background: -webkit-linear-gradient(right, #F8D353, #FF5C5A);\n' +
      'background: -moz-linear-gradient(right, #F8D353, #FF5C5A);\n' +
      'background: linear-gradient(to left, #F8D353, #FF5C5A);',

      'background: #D74F80;\n' +
      'background: -webkit-linear-gradient(right, #D74F80, #9241B5);\n' +
      'background: -moz-linear-gradient(right, #D74F80, #9241B5);\n' +
      'background: linear-gradient(to left, #D74F80, #9241B5);',

      'background: #CBC988;\n' +
      'background: -webkit-linear-gradient(right, #CBC988, #3F7890);\n' +
      'background: -moz-linear-gradient(right, #CBC988, #3F7890);\n' +
      'background: linear-gradient(to left, #CBC988, #3F7890);',

      'background: #B35D34;\n' +
      'background: -webkit-linear-gradient(right, #B35D34, #958B2A);\n' +
      'background: -moz-linear-gradient(right, #B35D34, #958B2A);\n' +
      'background: linear-gradient(to left, #B35D34, #958B2A);'
    ];

    let html = '';
    dataById.forEach(async link => {
      const isCategory = categories.findIndex(l => l.toLowerCase() === link.category.toLowerCase());
      if(isCategory === -1) return true;

      let collection = '';
      if(_categories.has(link.category)) {
        collection = _categories.get(link.category);
      } else {
        collection = `<div class="col s12"><div data-category="${link.category}" class="row"><h5 class="white-text col s12" style="${gradients[isCategory]}; margin: 0; margin-bottom: -7px; padding: 15px 10px;">${link.category.toUpperCase()}</h5><div class="row link-category">`;
      }

      const img = link.appIcon ? `<img src="${link.appIcon}" alt="${link.title}" />` : '<img class="empty-img" />';

      collection += `
                    <a href="https://arweave.net/${link.linkId}" target="_blank" rel="nofollow" class="js-addy-link link-item avatar col s12 l6" data-id="${link.id}" data-linkid="${link.linkId}" data-repository="${link.from}/${Utils.toSlug(link.title)}">
                        <div class="secondary-content center-align">
                            👍
                            <span class="app-votes">10</span>
                        </div>
                    
                        ${img}
                        <div class="title">${link.title}</div>
                        <small>${link.description}</small>
                    </a>`;

      _categories.set(link.category, collection);
    });

    const catsData = Array.from(_categories);
    catsData.sort((a, b) => a[0] > b[0]? 1 : a[0] < b[0]? -1 : 0);
    catsData.forEach(cat => {
      html += `${cat[1]}</div></div></div>`;
    });

    return html;
  }
};

export type LinksWorker = typeof linksWorker;
expose(linksWorker);
