/**
 * Gmailr v0.p.2 (planadecu update)
 * Licensed under The MIT License
 *
 * Copyright 2011, James Yu, Jordi Planadecursach
 */
 (function($, window) {

    locale = {
        "en": {
            "inbox": "Inbox",
            "send": "Send"
        },
        "ca": {
            "inbox": "Safata d'entrada",
            "send": "Envia"
        },
        "es": {
            "inbox": "Recibidos",
            "send": "Enviar"
        },
        "fr": {
            "inbox": "Boîte de réception",
            "send": "Envoyer"
        },
        "de": {
            "inbox": "Posteingang",
            "send": "Senden"
        },
        "af": {
            "inbox": "Inkassie",
            "send": "Stuur"
        },
        "nl": {
            "inbox": "Postvak IN",
            "send": "Verzenden"
        },
        "it": {
            "inbox": "Posta in arrivo",
            "send": "Invia"
        },
        "pt": {
            "inbox": "Caixa de entrada",
            "send": "Enviar"
        },
        "pl": {
            "inbox": "Odebrane",
            "send": "Wyślij"
        },
        "ru": {
            "inbox": "Входящие",
            "send": "Отправить"
        },
        "sv": {
            "inbox": "Inkorgen",
            "send": "Skicka"
        },
        "ja": {
            "inbox": "受信トレイ",
            "send": "送信"
        },
        "ko": {
            "inbox": "받은편지함",
            "send": "보내기"
        },
        "zh-CN": {
            "inbox": "收件箱",
            "send": "发送"
        },
        "no": {
            "inbox": "Innboks",
            "send": "Send"
        },
        "dk": {
            "inbox": "Indbakke",
            "send": "Send"
        },
        "fi": {
            "inbox": "Postilaatikko",
            "send": "Lähetä"
        },
        "ar": {
            "inbox": "البريد الوارد ‏",
            "send": "إرسال"
        },
        "iw": {
            "inbox": "דואר נכנס ‏",
            "send": "שלח"
        },
        "hu": {
            "inbox": "Beérkező levelek",
            "send": "Küldés"
        }

    };
    // Utility methods

    var dbg = function(msg) {
        if (Gmailr.debug) {
            console.log(msg);
        }
    };

    var p = function(els, m) {
        if (!els) {
            dbg(els);
        } else if (els.each) {
            if (els.length === 0) {
                dbg('p: Empty');
            } else {
                els.each(function(i, e) {
                    dbg(e);
                });
            }
        } else {
            dbg(els);
        }
    };

    var pm = function(m, els) {
        dbg(m);
        p(els);
    };

    var isDescendant = function(el, t) {
        return t.parents().index(el) >= 0;
    };

    var Gmailr = {

        /*
         * Public Methods and Variables
         */

         debug: true,
         inboxLink: null,
         priorityInboxLink: null,
         currentNumUnread: null,
         currentInboxCount: null,
         archived: [],
         elements: {},

        /*
            This is the main initialization routine. It bootstraps Gmailr into the Gmail interface.
            You must call this with a callback, like so:

            Gmailr.init(funciton(G) {
                // .. G is the Gmailr API object
            });
*/

init: function(cb) {
    var self = this;

    dbg('Initializing Gmailr API with google inbox ' + this.ginbox);

    var delayed_loader_count = 0;

        // Here we do delayed loading until success. This is in the case
        // that our script loads after Gmail has already loaded.
        self.delayed_loader = setInterval(function() {
            var canvas_frame;
            self.elements.canvas = (canvas_frame = document.getElementById("canvas_frame")) ?
            $(canvas_frame.contentDocument) : $(document);
            self.elements.body = self.elements.canvas.find('body').first();
            var mailLoaded = self.loaded && self.emailAddress().indexOf("@") !== -1;
            if (mailLoaded) {
                if (delayed_loader_count !== 0) {
                    dbg('Delayed loader success, email: ' + self.emailAddress());
                }

                self.elements.canvas.bind("DOMSubtreeModified", function(e) {
                    self.detectDOMEvents(e);
                });
                clearInterval(self.delayed_loader);
            } else {
                dbg('Calling delayed loader...');
                delayed_loader_count += 1;
                // we search from the body node, since there's no event to attach to
                self.bootstrap(self.elements.body, cb);
            }
        }, 500);
},

    /*
    Inserts the element to the top of the Gmail interface.
    */

    insertTop: function(el) {
        if (!this.loaded) throw "Call to insertTop before Gmail has loaded";
        this.elements.body.prepend($(el));
    },

    /*
    Allows you to apply jQuery selectors in the Gmail DOM, like so:

    G.$('.my_class');
    */

    $: function(selector) {
        return this.elements.body.find(selector);
    },

    /*
    Inserts a CSS file into the Gmail DOM.
    */

    insertCss: function(cssFile) {
        var css = $('<link rel="stylesheet" type="text/css">');
        css.attr('href', cssFile);
        this.elements.canvas.find('head').first().append(css);
    },

    /**S
     * Subscribe to a specific event in Gmail
     *   name                arguments passed to callback
     *   'archive'         - count
     *   'numUnreadChange' - currentVal, previousVal
     *   'delete'          - count
     *   'spam'            - count
     *   'compose'
     *   'viewChanged'
     *   'applyLabel'
     */
     observe: function(type, cb) {
        this.ob_queues[type].push(cb);
    },

    /**
     * Number of unread messages.
     */
     numUnread: function() {
        if (!this.loaded) throw "Call to numUnread before Gmail has loaded";

        // We always look to the inbox link, bc it always displays the number unread
        // no matter where you are in Gmail

        //var title = this.inboxLink[0].title;
        var title = this.inboxLink[0].title;
        var m = /\((\d+)\)/.exec(title);
        return (m && m[1]) ? parseInt(m[1]) : 0;
    },

    /**
     * Email address of the Gmail account.
     */
     emailAddress: function() {
        if (!this.loaded) throw "Call to emailAddress before Gmail has loaded";

        var mail;

        if (this.ginbox) {
            split = document.title.split(" ");
            mail = null;
            for (var i = 0; i < split.length && !mail; i++) {
                if (this.__validateEmail(split[i])) {
                    mail = split[i];
                }
            }
        } else {
            var emailSelectors = ['#guser b', '.gbmp1', ".gbps2"]

            mail = this.elements.canvas.find(emailSelectors.join(',')).first().html();
            if (!mail || mail.length) {
                split = this.elements.canvas.find(".cmsg .msg").html().trim().split(" ");
                mail = null;
                for (var i = 0; i < split.length && !mail; i++) {
                    var spliz = split[i].replace("...", "").replace(/…/g,"");
                    if (this.__validateEmail(spliz)) {
                        mail = spliz;
                    }
                }
            }else{
                mail.replace("...", "").replace(/…/g,"");
            }
        }
        return mail;
    },

    __validateEmail: function(mail) {
        return /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/.test(mail);
    },

    /**
     * Language of gmail
     */
     language: function() {
        return this.lang;
    },


    /**
     * Returns whether the current view is a threaded or conversation view.
     */
     currentView: function() {
        if (!this.loaded) throw "Call to currentView before Gmail has loaded";

        if (this.elements.canvas.find('h1.ha').length > 0) {
            return 'conversation';
        } else {
            return 'thread';
        }
    },

    /**
     * Returns whether the current view is google inbox ( not gmail)
     */
    isGinbox: function(){
        return this.ginbox;
    },

    /*****************************************************************************************
     * Private Methods
     */


    /**
     * This method attempts to bootstrap Gmailr into the Gmail interface.
     * Basically, this amounts polling to make sure Gmail has fully loaded,
     * and then setting up some basic hooks.
     */

     bootstrap: function(el, cb) {
        var self = this;
        if (el) {
            var el = $(el);

            self.ginbox = (window.location + "").indexOf("inbox.google") != -1;

            // get handle on the left menu
            if (!this.leftMenu || this.leftMenu.length == 0) {
                //                  this.leftMenu = el.find('.no .nM .TK').first().closest('.nn');

                // use the inbox link as an anchor
                for (var lang in locale) {
                    var v = el.find('a[href$="#inbox"][title^="' + locale[lang].inbox + '"]');
                    if (v.length > 0) {
                        this.inboxLink = v.first();
                        this.lang = lang;
                        break;
                    }
                }

                var v = el.find('a[href$="#mbox"]');
                if (v.length > 0) this.priorityInboxLink = v.first();

                if (this.inboxLink) {
                    this.leftMenu = this.inboxLink.closest('.TO').closest('div');
                } else if (this.priorityInboxLink) {
                    this.leftMenu = this.priorityInboxLink.closest('.TO').closest('div');
                }

                if (this.leftMenu && this.leftMenu.length > 0) {
                    this.leftMenuItems = this.leftMenu.find('.TO');

                    p('Fully loaded');
                    this.loaded = true;

                    this.currentNumUnread = this.numUnread();

                    if (this.inboxTabHighlighted())
                        this.currentInboxCount = this.toolbarCount();

                    this.xhrWatcher.init();
                    if (cb) cb(self);

                } else if (self.ginbox && $(".loadingSpinner").length == 0) {
                    p('Fully loaded with google inbox');
                    this.loaded = true;
                    
                    if (cb) cb(self);
                }
            }
        }
    },

    xhrWatcher: {
        xhrParams: null,
        initialized: null,

        init: function() {
            var self = this;

            if (!this.initialized) {
                this.initialized = true;
                var win = top.document.getElementById("js_frame").contentDocument.defaultView;

                win.XMLHttpRequest.prototype._Gmail_open = win.XMLHttpRequest.prototype.open;
                win.XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
                    var out = this._Gmail_open.apply(this, arguments);
                    this.xhrParams = {
                        method: method.toString(),
                        url: url.toString()
                    };
                    return out;
                };

                win.XMLHttpRequest.prototype._Gmail_send = win.XMLHttpRequest.prototype.send;
                win.XMLHttpRequest.prototype.send = function(body) {
                    var out = this._Gmail_send.apply(this, arguments);
                    if (this.xhrParams) {
                        this.xhrParams.body = body;
                        Gmailr.detectXHREvents(this.xhrParams);
                    }
                    return out;
                }

                if (!top._Gmail_iframeFn) {
                    top._Gmail_iframeFn = top.GG_iframeFn;
                    this.iframeData = {};
                    this.iframeCachedData = [];
                    this.iframeCachedData.push({
                        responseDataId: 1,
                        url: top.location.href,
                        responseData: top.VIEW_DATA
                    });

                    top.GG_iframeFn = function(win, data) {
                        var d = top._Gmail_iframeFn.apply(this, arguments);
                        try {
                            var url = win && win.location ? win.location.href : null;
                            if (url && data && (url.indexOf("act=") != -1)) {

                                if (!self.iframeData[url]) {

                                    var body = "";
                                    var parent = win.frameElement.parentNode;
                                    if (parent && $(parent).find('form').length > 0)
                                        body = $(parent).find('form').first().serialize();

                                    self.iframeData[url] = true;
                                    Gmailr.detectXHREvents({
                                        body: body,
                                        url: url
                                    });
                                }
                            }
                        } catch (e) {
                            try {
                                dbg("DEBUG error in GG_iframeFn: " + e);
                            } catch (e) {}
                        }
                        return d
                    }
                }

            }
        }
    },

    currentLeftMenuItem: null,
    ob_queues: {
        archive: [],
        'delete': [],
        spam: [],
        reply: [],
        tabChange: [],
        compose: [],
        numUnreadChange: [],
        inboxCountChange: [],
        viewChanged: [],
        applyLabel: []
    },
    loaded: false,

    liveLeftMenuItem: function() {
        if (!this.loaded) return null;

        var el = this.leftMenuItems.filter('.nZ').find('a');
        if (el[0]) {
            return el[0].title;
        } else {
            return null;
        }
    },

    inboxTabHighlighted: function() {
        return this.currentTabHighlighted() == 'inbox' || this.currentTabHighlighted() == 'priority_inbox';
    },

    currentTabHighlighted: function() {
        if (this.inboxLink && this.inboxLink.closest('.TO').hasClass('nZ')) {
            return 'inbox';
        } else if (this.priorityInboxLink && this.priorityInboxLink.closest('.TO').hasClass('nZ')) {
            return 'priority_inbox';
        } else {
            return null;
        }
    },

    sendButton: function() {
        var el = $([]);
        
        for (var lang in locale) {
            if(this.ginbox){
                el = this.elements.canvas.find("div[role='button']").filter(function(){
                  return $(this).text().toUpperCase() == locale[lang].send.toUpperCase();
              });
            }else{
                el = this.elements.canvas.find("div[data-tooltip^='" + locale[lang].send + "']").filter(function(index) {
                    return $(this).text().toUpperCase() == locale[lang].send.toUpperCase();
                });
            }
            if (el.length > 0) return el;
        }
        
        return el;
    },

    cloneSendButton: function() {

    },

    // Return true if a yellow archive highlight actually means the user is archiving
    archiveableState: function() {
        // For threads, this overrestricts:
        //   TODO: should detect if user is archiving an inbox item from a non-inbox view
        // For conversations, this underrestricts:
        //   TODO: should detect if the current email is in the inbox, and only assign points if it is
        return (this.inboxTabHighlighted() && this.currentView() == 'thread') || (this.currentView() != 'thread');
    },

    mainListingEl: function() {
        return this.elements.canvas.find('.Cp').first();
    },

    mainListingEmpty: function() {
        if (this.mainListingEl().length > 0 && this.currentView() == 'thread') {
            return this.mainListingEl().find('table tr').length == 0;
        } else {
            return null;
        }
    },

    toolbarEl: function() {
        return this.elements.canvas.find('.D.E').first();
    },

    toolbarCount: function() {
        var el = this.toolbarEl().find('.dJ');
        if (el[0]) {
            var t = el[0].innerHTML;

            var m = /of <b>(\d+)<\/b>/.exec(t);

            if (m && m[1]) {
                return parseInt(m[1]);
            } else {
                return null;
            }
        } else {
            if (this.mainListingEmpty()) {
                return 0;
            } else {
                return null;
            }
        }
    },

    detectXHREvents: function(params) {
        var self = this;

        try {
            var m = /[?&]act=([^&]+)/.exec(params.url);
            if (m && m[1]) {
                var action = decodeURIComponent(m[1]);
                var count = 1;

                var urlParams = $.deparam(params.url);

                if (params.body.length > 0) {
                    var postParams = $.deparam(params.body);
                    if (postParams['t'] instanceof Array)
                        count = postParams['t'].length;

                    if (postParams['ba']) {
                        // The user has cleared more than a pageful, just give'em 50 points
                        count = 50;
                    }
                }
                switch (action) {
                    case "rc_^i": // Archiving
                        // only count if from inbox or query
                        // TODO: could do better
                        if (urlParams['search'] == 'inbox' || urlParams['search'] == 'query' || urlParams['search'] == 'cat' || urlParams['search'] == 'mbox') {
                            if (postParams) {
                                // Get list of email hashes
                                var emails = postParams['t'] instanceof Array ? postParams['t'] : [postParams['t']];
                                var emailsArchived = [];
                                emails.forEach(function(e) {
                                    // Make sure user didn't already archive this email
                                    if (self.archived.indexOf(e) == -1)
                                        emailsArchived.push(e);
                                });

                                this.archived = this.archived.concat(emailsArchived);

                                if (emailsArchived.length > 0) {
                                    p("User archived " + emailsArchived.length + " emails.");
                                    this.executeObQueues('archive', count);
                                }

                                delete emails;
                                delete emailsArchived;
                            }
                        }
                        break;
                    case "arl": //applying label
                    var label = urlParams["acn"];
                    var emails = postParams['t'] instanceof Array ? postParams['t'] : [postParams['t']];
                    this.executeObQueues('applyLabel', label, emails);
                    break;
                    case "tr": // Deleting
                    p("User deleted " + count + " emails.");
                    this.executeObQueues('delete', count);
                    break;
                    case "sm": // Composing
                    if (this.currentView() == 'conversation') {
                        p("User replied to an email.");
                        this.executeObQueues('reply', 1);
                    } else {
                        p("User composed an email.");
                        this.executeObQueues('compose', 1);
                    }
                    break;
                    case "sp": // Spam
                    p("User spammed " + count + " emails.");
                    this.executeObQueues('spam', count);
                    break;
                }
            }
        } catch (e) {
            dbg("Error in detectXHREvents: " + e);
        }
    },

    inConversationView: false,

    detectDOMEvents: function(e) {
        var el = $(e.target);

        // Left Menu Changes
        /*var s = this.liveLeftMenuItem();
        if(this.currentLeftMenuItem != s) {
            this.currentLeftMenuItem = s;
            this.executeObQueues('tabChange', s);
        }

        // Unread change
        var l = this.inboxLink ? this.inboxLink : this.priorityInboxLink;
        if((el[0] == l[0]) || isDescendant(el, l)) {
            if(this.currentNumUnread != this.numUnread()) {
                this.executeObQueues('numUnreadChange', this.numUnread(), this.currentNumUnread);
                this.currentNumUnread = this.numUnread();
            }
        }*/

        if (this.elements.canvas.find('.ha').length > 0) {
            if (!this.inConversationView) {
                this.inConversationView = true;
                this.executeObQueues('viewChanged', 'conversation');
            }
        } else {
            if (this.inConversationView) {
                this.inConversationView = false;
                this.executeObQueues('viewChanged', 'threaded');
            }
        }

        // Inbox count change
        if (isDescendant(this.toolbarEl(), el)) {
            var toolbarCount = this.toolbarCount();
            if (this.inboxTabHighlighted() && toolbarCount !== null) {
                if ((this.currentInboxCount === null) || (toolbarCount != this.currentInboxCount)) {
                    if (this.currentInboxCount !== null)
                        this.executeObQueues('inboxCountChange', toolbarCount, this.currentInboxCount);
                    this.currentInboxCount = toolbarCount;
                }
            }
        }
    },

    executeObQueues: function(type, arg) {
        if (this.ob_queues[type])
            for (var i = 0; i < this.ob_queues[type].length; i++) {
                var args = Array.prototype.slice.call(arguments, 1);
                (this.ob_queues[type][i]).apply(this, args)
            }
        }
    };

    window.Gmailr = Gmailr;

})(jQuery, window);