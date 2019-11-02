import {expose} from 'threads';

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

    function toSlug(str) {
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
        collection = `<div data-category="${link.category}" class="col s12"><h5 class="white-text" style="${gradients[isCategory]}; margin: 0; margin-bottom: -7px; padding: 15px 10px;">${link.category.toUpperCase()}</h5><ul class="collection">`;
      }

      const img = link.appIcon ? `<img src="${link.appIcon}" alt="${link.title}" />` : '<img class="empty-img" />';

      collection += `
                    <li class="collection-item avatar" data-id="${link.id}" data-linkid="${link.linkId}" data-repository="${toSlug(link.fromUser)}/${toSlug(link.title)}">
                        <div class="secondary-content center-align">
                            <a href="#" class="js-vote material-icons">arrow_drop_up</a>
                            <span class="app-votes">${link.votes.length}</span>
                        </div>
                    
                        <a href="https://arweave.net/${link.linkId}" target="_blank" rel="nofollow" class="js-addy-link">
                            ${img}
                            <div class="title"><span style="max-width: 100px; float: left;" class="truncate">${link.fromUser}</span> <span style="margin-left: 5px">/ ${link.title}</span></div>
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