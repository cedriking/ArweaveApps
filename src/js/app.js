"use strict";

var __awaiter = void 0 && (void 0).__awaiter || function (thisArg, _arguments, P, generator) {
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }

    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }

    function step(result) {
      result.done ? resolve(result.value) : new P(function (resolve) {
        resolve(result.value);
      }).then(fulfilled, rejected);
    }

    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};

var __generator = void 0 && (void 0).__generator || function (thisArg, body) {
  var _ = {
    label: 0,
    sent: function sent() {
      if (t[0] & 1) throw t[1];
      return t[1];
    },
    trys: [],
    ops: []
  },
      f,
      y,
      t,
      g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;

  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }

  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");

    while (_) {
      try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
        if (y = 0, t) op = [op[0] & 2, t.value];

        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;

          case 4:
            _.label++;
            return {
              value: op[1],
              done: false
            };

          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;

          case 7:
            op = _.ops.pop();

            _.trys.pop();

            continue;

          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }

            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }

            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }

            if (t && _.label < t[2]) {
              _.label = t[2];

              _.ops.push(op);

              break;
            }

            if (t[2]) _.ops.pop();

            _.trys.pop();

            continue;
        }

        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
    }

    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};

var arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

function get_name(addr) {
  return __awaiter(this, void 0, void 0, function () {
    var get_name_query, txs, tx;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          get_name_query = {
            op: 'and',
            expr1: {
              op: 'equals',
              expr1: 'App-Name',
              expr2: 'arweave-id'
            },
            expr2: {
              op: 'and',
              expr1: {
                op: 'equals',
                expr1: 'from',
                expr2: addr
              },
              expr2: {
                op: 'equals',
                expr1: 'Type',
                expr2: 'name'
              }
            }
          };
          return [4
          /*yield*/
          , arweave.api.post("arql", get_name_query)];

        case 1:
          txs = _a.sent();
          if (txs.data.length == 0) return [2
          /*return*/
          , addr];
          return [4
          /*yield*/
          , arweave.transactions.get(txs.data[0])];

        case 2:
          tx = _a.sent();
          return [2
          /*return*/
          , tx.get('data', {
            decode: true,
            string: true
          })];
      }
    });
  });
}

var PublishApp =
/** @class */
function () {
  function PublishApp() {
    this.appCategories = ["Games", "Gambling", "Social", "Finance", "High risk", "Exchanges", "Development", "Media", "Wallet", "Stores", "Security", "Governance", "Property", "Storage", "Identity", "Energy", "Health", "Insurance"];
  }

  PublishApp.prototype.init = function () {
    this.events();
  };

  PublishApp.prototype.events = function () {
    var _this = this;

    $('#app-title, #app-description').characterCounter();
    $('#app-image').click(function () {
      _this.activeAppImage = 'image';
      $('#imgfile').click();
    });
    $('#app-icon').click(function () {
      _this.activeAppImage = 'icon';
      $('#imgfile').click();
    });
    $('#imgfile').change(function (e) {
      _this.imageConvert(e.target.files[0]);
    });
    $('#publish-form').submit(function (e) {
      e.preventDefault();

      _this.publish();
    });
  };

  PublishApp.prototype.imageConvert = function (file) {
    var _this = this;

    var reader = new FileReader();

    reader.onload = function (img) {
      $("#app-" + _this.activeAppImage).attr('src', img.target.result);

      if (_this.activeAppImage === 'image') {
        _this.appImage = img.target.result;
      } else {
        _this.appIcon = img.target.result;
      }
    };

    reader.readAsDataURL(file);
  };

  PublishApp.prototype.publishVote = function (appId) {
    return __awaiter(this, void 0, void 0, function () {
      var appIndex, i, j, app_1, k, l, vote, tx;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!app.loggedIn) {
              $('#modal-login').modal('open');
              return [2
              /*return*/
              , alert('Login to vote.')];
            }

            appIndex = -1;

            for (i = 0, j = db.apps.length; i < j; i++) {
              app_1 = db.apps[i];

              if (app_1.appId = appId) {
                appIndex = i;

                for (k = 0, l = app_1.votes.length; k < l; k++) {
                  vote = app_1.votes[k];

                  if (vote.from === app_1.walletAddress) {
                    return [2
                    /*return*/
                    , alert('You already voted for this link.')];
                  }
                }
              }
            }

            return [4
            /*yield*/
            , arweave.createTransaction({
              data: 'voteup'
            }, app.wallet)];

          case 1:
            tx = _a.sent();
            tx.addTag('App-Name', App.appName);
            tx.addTag('App-Version', App.appVersion);
            tx.addTag('Unix-Time', Math.round(new Date().getTime() / 1000));
            tx.addTag('Type', 'vote');
            tx.addTag('App-Id', appId);
            return [4
            /*yield*/
            , arweave.transactions.sign(tx, app.wallet)];

          case 2:
            _a.sent();

            console.log(tx.id);
            return [4
            /*yield*/
            , arweave.transactions.post(tx)];

          case 3:
            _a.sent();

            db.apps[appIndex].votes.push({
              from: app.walletAddress
            });
            return [2
            /*return*/
            , alert('Vote sent. Thank you.')];
        }
      });
    });
  };

  PublishApp.prototype.publish = function () {
    return __awaiter(this, void 0, void 0, function () {
      var title, category, appId, description, i, j, app_2, data, tx;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!app.loggedIn) {
              $('#modal-login').modal('open');
              return [2
              /*return*/
              , alert('Login and then hit publish again.')];
            }

            title = this.htmlToTxt($.trim($('#app-title').val()));
            category = this.htmlToTxt($.trim($('#app-category').val()));
            appId = this.htmlToTxt($.trim($('#app-link').val()));
            description = this.htmlToTxt($.trim($('#app-description').val()));

            for (i = 0, j = db.apps.length; i < j; i++) {
              app_2 = db.apps[i];
              console.log(app_2.title.toLowerCase(), title.toLowerCase());

              if (app_2.title.toLowerCase() === title.toLowerCase()) {
                return [2
                /*return*/
                , alert('This app is already published')];
              }
            }

            if (title.length < 3 || title.length > 25) {
              return [2
              /*return*/
              , alert('The app title must be between 3 and 25 characters.')];
            }

            if ($.inArray(category, this.appCategories) === -1) {
              return [2
              /*return*/
              , alert('Invalid category.')];
            }

            if (description.length < 10 || description.length > 140) {
              return [2
              /*return*/
              , alert('The description must be between 10 and 140 characters.')];
            }

            if (
            /*!this.appImage || !this.appImage.length ||*/
            !this.appIcon || !this.appIcon.length) {
              return [2
              /*return*/
              , alert('Permaweb icon is required.')];
            }

            if (appId.length !== 43) {
              return [2
              /*return*/
              , alert('Invalid App ID.')];
            }

            data = {
              title: title,
              category: category,
              appId: appId,
              appIcon: this.appIcon,
              description: description
            };
            return [4
            /*yield*/
            , arweave.createTransaction({
              data: JSON.stringify(data)
            }, app.wallet)];

          case 1:
            tx = _a.sent();
            tx.addTag('App-Name', App.appName);
            tx.addTag('App-Version', App.appVersion);
            tx.addTag('Unix-Time', Math.round(new Date().getTime() / 1000));
            tx.addTag('Type', 'publish');
            tx.addTag('Category', category);
            return [4
            /*yield*/
            , arweave.transactions.sign(tx, app.wallet)];

          case 2:
            _a.sent();

            console.log(tx.id); //await arweave.transactions.post(tx);

            return [2
            /*return*/
            , alert('App sent, will be available after one block.')];
        }
      });
    });
  };

  PublishApp.prototype.htmlToTxt = function (str) {
    return $("<div>" + str + "</div>").text();
  };

  return PublishApp;
}();

var publishApp = new PublishApp();

var DB =
/** @class */
function () {
  function DB() {
    this.apps = [];
  }

  DB.prototype.init = function () {
    this.getAllApps()["catch"](console.log);
  };

  DB.prototype.getAllApps = function () {
    return __awaiter(this, void 0, void 0, function () {
      var queryApps, res, _a;

      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            queryApps = {
              op: 'and',
              expr1: {
                op: 'equals',
                expr1: 'App-Name',
                expr2: 'arweaveapps'
              },
              expr2: {
                op: 'equals',
                expr1: 'Type',
                expr2: 'publish'
              }
            };
            console.log('fetching published apps...');
            return [4
            /*yield*/
            , arweave.api.post("arql", queryApps)];

          case 1:
            res = _b.sent();
            console.log('finished fetching published apps.');
            this.apps = [];
            if (!res.data.length) return [3
            /*break*/
            , 3];
            _a = this;
            return [4
            /*yield*/
            , Promise.all(res.data.map(function (id) {
              return __awaiter(this, void 0, void 0, function () {
                var txRow, tx, jsonData, data, _a, _b, queryVotes, res, votes;

                return __generator(this, function (_c) {
                  switch (_c.label) {
                    case 0:
                      txRow = {};
                      return [4
                      /*yield*/
                      , arweave.transactions.get(id)];

                    case 1:
                      tx = _c.sent();
                      tx.get('tags').forEach(function (tag) {
                        var key = tag.get('name', {
                          decode: true,
                          string: true
                        });
                        var value = tag.get('value', {
                          decode: true,
                          string: true
                        });
                        txRow[key] = value;
                      });
                      jsonData = tx.get('data', {
                        decode: true,
                        string: true
                      });
                      data = JSON.parse(jsonData);
                      txRow['id'] = id;
                      txRow['icon'] = data.appIcon;
                      _a = txRow;
                      _b = 'from';
                      return [4
                      /*yield*/
                      , arweave.wallets.ownerToAddress(tx.owner)];

                    case 2:
                      _a[_b] = _c.sent();
                      txRow['title'] = data.title;
                      txRow['appId'] = data.appId;
                      txRow['description'] = data.description;
                      queryVotes = {
                        op: 'and',
                        expr1: {
                          op: 'and',
                          expr1: {
                            op: 'equals',
                            expr1: 'App-Name',
                            expr2: 'arweaveapps'
                          },
                          expr2: {
                            op: 'equals',
                            expr1: 'Type',
                            expr2: 'vote'
                          }
                        },
                        expr2: {
                          op: 'and',
                          expr1: {
                            op: 'equals',
                            expr1: 'App-Id',
                            expr2: data.appId
                          },
                          expr2: {
                            op: 'equals',
                            expr1: 'Type',
                            expr2: 'vote'
                          }
                        }
                      };
                      console.log("fetching votes for app " + data.title + " (" + id + ")...");
                      return [4
                      /*yield*/
                      , arweave.api.post("arql", queryVotes)];

                    case 3:
                      res = _c.sent();
                      console.log("finished fetching votes for app " + data.title + " (" + id + ")");
                      votes = [];
                      if (!res.data.length) return [3
                      /*break*/
                      , 5];
                      return [4
                      /*yield*/
                      , Promise.all(res.data.map(function (id) {
                        return __awaiter(this, void 0, void 0, function () {
                          var txRow, tx, _a, _b;

                          return __generator(this, function (_c) {
                            switch (_c.label) {
                              case 0:
                                txRow = {};
                                return [4
                                /*yield*/
                                , arweave.transactions.get(id)];

                              case 1:
                                tx = _c.sent();
                                tx.get('tags').forEach(function (tag) {
                                  var key = tag.get('name', {
                                    decode: true,
                                    string: true
                                  });
                                  var value = tag.get('value', {
                                    decode: true,
                                    string: true
                                  });
                                  txRow[key] = value;
                                });
                                txRow['id'] = id;
                                _a = txRow;
                                _b = 'from';
                                return [4
                                /*yield*/
                                , arweave.wallets.ownerToAddress(tx.owner)];

                              case 2:
                                _a[_b] = _c.sent();
                                return [2
                                /*return*/
                                , txRow];
                            }
                          });
                        });
                      }))];

                    case 4:
                      votes = _c.sent();
                      _c.label = 5;

                    case 5:
                      txRow['votes'] = votes;
                      return [2
                      /*return*/
                      , txRow];
                  }
                });
              });
            }))];

          case 2:
            _a.apps = _b.sent();
            _b.label = 3;

          case 3:
            if (this.apps.length) {
              // Sort by date and by votes
              this.apps.sort(function (a, b) {
                return a['Unix-Time'] < b['Unix-Time'] ? 1 : a['Unix-Time'] > b['Unix-Time'] ? -1 : 0;
              });
              this.apps.sort(function (a, b) {
                return a.votes.length < b.votes.length ? 1 : a.votes.length > b.votes.length ? -1 : 0;
              });
              this.apps.forEach(function (app) {
                if (app.id === 'VzZVguWilkpN6bCFYJxJOt33N8H3qGmfdHBkkeJAIkg') return true;

                if ($.inArray(app.Category, publishApp.appCategories) !== -1) {
                  var $collection = void 0;

                  if (!$("div[data-category=\"" + app.Category + "\"]").length) {
                    $collection = $('<ul class="collection"></ul>');
                    $('.js-app-list').append($("<div data-category=\"" + app.Category + "\" class=\"col s12 m6 l4\"><h5>" + app.Category.toUpperCase() + "</h5></div>").append($collection));
                  } else {
                    $collection = $("div[data-category=\"" + app.Category + "\"]").find('.collection');
                  }

                  $collection.append("\n                        <li class=\"collection-item avatar\" data-app=\"" + app.appId + "\" data-id=\"" + app.id + "\">\n                            <a href=\"https://arweave.net/" + app.appId + "\" target=\"_blank\" rel=\"nofollow\">\n                                <img src=\"" + app.icon + "\" alt=\"" + app.title + "\">\n                                <span class=\"title\">" + app.title + "</span>\n                                <small>" + app.description + "</small>\n                            </a>\n\n                            <div class=\"secondary-content center-align\">\n                                <a href=\"#\" class=\"js-vote material-icons\">arrow_drop_up</a>\n                                <span class=\"app-votes\">" + app.votes.length + "</span>\n                            </div>\n                        </li>");
                }
              });
            }

            return [2
            /*return*/
            , this.apps];
        }
      });
    });
  };

  return DB;
}();

var db = new DB();

var App =
/** @class */
function () {
  function App() {
    this.loggedIn = false;
    window.onhashchange = this.hashChanged;
  }

  App.prototype.init = function () {
    db.init();
    publishApp.init();
    this.hashChanged();
    this.events();
  };

  App.prototype.events = function () {
    var _this = this;

    $('#keyfile').change(function (e) {
      _this.login(e);
    });
    $('header').on('click', '.btn-small', function (e) {
      $('.btn-small').blur();
    }); // little hack to remove the focus color on the publish app button

    $('.js-app-list').on('click', '.js-vote', function (e) {
      e.preventDefault();
      publishApp.publishVote($(e.target).parents('.collection-item').first().data('app'));
    });
  };

  App.prototype.hashChanged = function () {
    var page = 'home';

    if (window.location.hash) {
      var newPage = window.location.hash.substring(1).split('?')[0];

      if (newPage === 'logout') {
        window.location.href = window.location.href.split('#')[0];
      } else if (newPage === 'home' || newPage === 'publish' || newPage === 'view') {
        page = newPage;
      }
    }

    $('[id^="page-"]').hide();
    $("#page-" + page).show();
    $('.js-page-active').removeClass('active');
    $(".js-page-active[data-page=" + page + "]").addClass('active');
  };

  App.prototype.login = function (ev) {
    var _this = this;

    var fileReader = new FileReader();

    fileReader.onload = function (e) {
      _this.loggedIn = true;
      _this.wallet = JSON.parse(e.target.result);
      arweave.wallets.jwkToAddress(_this.wallet).then(function (address) {
        _this.walletAddress = address;
        get_name(address).then(function (username) {
          _this.walletUser = username;
          $('.account-box').removeClass('hide').children('strong').text(username);
        });
      });
      $('#modal-login').modal('close');
    };

    fileReader.readAsText(ev.target.files[0]);
  };

  App.appName = 'arweaveapps';
  App.appVersion = '0.0.1';
  return App;
}();

var app = new App();
$(document).ready(function () {
  $('.modal').modal();
  $('select').formSelect();
  app.init();
});