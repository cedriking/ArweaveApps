const arweave = Arweave.init({host: 'arweave.net', port: 443, protocol: 'https', timeout: 60000});

class App {
  constructor() {
    this._appName = 'arweaveapps';
    this._appVersion = '0.1.1';

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
      } else if(newPage === 'publish' && !accounts.loggedIn) {
        page = 'home';
      } else if(newPage === 'home' || newPage === 'publish' || newPage === 'view') {
        page = newPage;
      } else if(newPage.indexOf('/') > 0) {
        const go = () => {
          if(!links.contentLoaded) {
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
    $('select').formSelect();
  }

  get appName() {
    return this._appName;
  }

  get appVersion() {
    return this._appVersion;
  }
}
const app = new App();
