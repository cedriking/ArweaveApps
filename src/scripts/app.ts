import $ from 'cash-dom';
import Arweave from 'arweave/web';
import {accounts} from "./accounts";
import {links} from "./links";
import {votes} from "./votes";
import { DB } from './utils/db';
import PST from './utils/pst';

export const pst = new PST('CgTaSphiS39GHyXp13o4nhpmj_DcDM7b37Rnt8lmYIk');
export const arweave = Arweave.init({});
export const db = new DB('arapps');

export class App {
  static appName = 'arweaveapps';
  static appVersion = '0.2.2';

  constructor() {
    window.onhashchange = () => this.hashChanged();
  }

  init() {
    accounts.init();
    links.init();
    votes.init();

    this.hashChanged();
    this._events();
  }

  hashChanged() {
    let page = 'home';

    if(window.location.hash) {
      const newPage = window.location.hash.substring(1).split('?')[0];

      if(newPage === 'logout') {
        window.location.href = window.location.href.split('#')[0];
      } else if(newPage === 'publish' && !accounts.isLoggedIn) {
        page = 'home';
      } else if(newPage === 'home' || newPage === 'publish' || newPage === 'view') {
        page = newPage;
      } else if(newPage.indexOf('/') > 0) {
        const go = () => {
          if(!links.isContentLoaded) {
            return setTimeout(() => go(), 100);
          }

          const link = newPage.split('/');
          const $elem = $(`[data-repository="${links.toSlug(link[0])}/${links.toSlug(link[1])}"]`);
          if($elem.length) {
            window.location.href = $elem.find('.js-addy-link').attr('href');
          }
        };
        console.log(newPage.split('/'));
        go();
      }
    }

    $('[id^="page-"]').hide();
    $(`#page-${page}`).show();

    $('.js-page-active').removeClass('active');
    $(`.js-page-active[data-page=${page}]`).addClass('active');
  }

  _events() {
    M.FormSelect.init(document.querySelectorAll('select'));
  }
}
export const app = new App();
app.init();