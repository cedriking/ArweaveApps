import {expose} from 'threads';
import {Utils} from "../utils";

const linksWorker = {
  sortByVotes: async data => {
    return data.sort((a, b) => a.votes.length < b.votes.length? 1 : a.votes.length > b.votes.length? -1 : 0);
  },
  createDataById: async data => {
    const dataById = new Map();
    for(let i = 0, j = data.length; i < j; i++) {
      dataById.set(data[i].id, data[i]);
    }

    return dataById;
  },
  getUserPermawebs: async options => {
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
  convertAllToHtml: async data => {
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
};

export type LinksWorker = typeof linksWorker;
expose(linksWorker);