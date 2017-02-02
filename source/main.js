var logMsg = "## Gmail Template Manager " + version + ": ";
console.log(logMsg + "LOADING...");

Parse.initialize('gmail-templates', 'unused');
Parse.serverURL = 'https://gmail-templates.herokuapp.com/api';

window.usage = {
    "version": version
};

Parse.Analytics.track('gtm_loading', usage);

var loadTemplate = function (name, context) {
    var req = new XMLHttpRequest();
    req.open("GET", getData(name), true);
    req.onreadystatechange = function () {
        if (req.readyState == 4 && req.status == 200) {
            if (typeof context == "undefined") context = window;
            context[name] = req.responseText;
        }
    };
    req.send(null);
};
var jsTemplates = {};
loadTemplate('jqote_template_list', jsTemplates);
loadTemplate('jqote_template_update', jsTemplates);
loadTemplate('jqote_template_settings', jsTemplates);

Gmailr.debug = false; // Turn verbose debugging messages on

Gmailr.init(function (G) {
    var email = G.emailAddress();
    window.usage.lang = G.language() || "undefined";
    window.usage.ginbox = (!!G.isGinbox()) ? "ginbox" : "gmail";

    login(email, email);
    var Template = Parse.Object.extend("Template");

    var templates = [];

    var query = new Parse.Query(Template);
    query.equalTo("email", email).equalTo("active", true).descending("name");
    var templatesLoaded = false;

    var fetchTemplates = function (okCallback) {
        query.find({
            success: function (result) {
                if (result.length == 0) {
                    var user = Parse.User.current();
                    var template = new Template();
                    template.id = "temp";
                    template.set("active", true);
                    template.set("email", email);
                    template.set("lang", G.language());
                    if (typeof user != "undefined" && typeof user != null) {
                        template.set("user", user);
                        template.setACL(new Parse.ACL(user));
                    }
                    template.set("name", "Welcome template");
                    template.set("subject", "Invoice reminder");
                    template.set("content", "Dear ${1:text:Insert name},<br/><br/>The total amount of your invoice is USD ${3:number:Total budget} that you can pay via wire transfer to the following bank account: ${2:text:Bank account number}<br/> <br/> The invoice will be done with name: ${1}<br/> <br/>Yours faithfully,<br/>${me}<br/>");
                    result.push(template);

                }
                templates = result;
                console.log("Templates loaded: " + templates.length);
                templatesLoaded = true;
                if (!!okCallback) okCallback(templates);
            },
            error: function (error) {
                console.log("Error: " + error.code + " " + error.message);
            }
        });
    };

    fetchTemplates();

    var templateButtonHandler = function (button, timeShow) {
        if (!timeShow) timeShow = 200;
        var templateNum = templates.length;
        fetchTemplates(function (newTemplates) {
            if (templateNum != newTemplates.length) templateButtonHandler(button, 0);
        });
        if (!templatesLoaded) {
            alert("Templates not yet loaded.");
            return;
        }
        if (!button || button.jQuery == null) {
            button = $(this);
        }
        $('.template-list').hide().remove();
        var popup = $($.jqote(jsTemplates.jqote_template_list, [templates])).hide().appendTo(document.body);

        $(".minibutton.close", popup).click(function () {
            popup.hide();
        });
        $(".minibutton.settings", popup).click(function () {
            settings();
        });

        var settings = function () {
            $('.template-settings').hide().remove();
            var popupsettings = $($.jqote(jsTemplates.jqote_template_settings)).hide().appendTo(document.body);
            //popupsettings.find(".template-content-editor").ckeditor({height:"100%"});

            $(".minibutton.close", popupsettings).click(function () {
                popupsettings.hide();
            });

            $(".button.deleteall", popupsettings).click(function () {
                if (confirm("Are you sure that you want to delete all the templates?")) {
                    Parse.Analytics.track('gtm_template_deleteall', usage);
                }
            });
            $(".button.recoverall", popupsettings).click(function () {
                if (confirm("This action is going to restore all the previously deleted templates. Are you sure you want to make that?")) {
                    Parse.Analytics.track('gtm_template_restoreall', usage);
                }
            });
            $(".button.import", popupsettings).click(function () {
                var templatesJson = prompt("Paste the import text extracted from the 'export' button.");
                if (templatesJson != null) try {
                    var templatesJson = eval(templatesJson);
                    if (confirm("Are you sure that you want to import " + templatesJson.length + " templates?")) {
                        for (i = 0; i < templatesJson.length; i++) {
                            var template = new Template();
                            template.set("active", true);
                            template.set("email", email);
                            template.set("user", Parse.User.current());
                            template.set("lang", Gmailr.language());
                            template.setACL(new Parse.ACL(Parse.User.current()));
                            template.set("name", templatesJson[i].name);
                            template.set("subject", templatesJson[i].subject);
                            template.set("content", templatesJson[i].content);
                            template.set("createdAt", templatesJson[i].createdAt);
                            template.set("importedFrom", templatesJson[i].email);
                            try {
                                templates.push(template);
                                template.save();
                            } catch (er) {
                                //don't save the template if duplicate
                            }
                        }
                        Parse.Analytics.track('gtm_template_import_success', usage);
                        templateButtonHandler(button, 0);
                        popupsettings.hide();
                    }
                } catch (e) {
                    alert("Error importing templates. Input not valid. Make sure you completely copied the export input. Error message: " + e)
                }
                Parse.Analytics.track('gtm_template_import', usage);
            });
            $(".button.export", popupsettings).click(function () {
                query.find({
                    success: function (templates) {
                        if (templates.length == 0) {
                            alert("No templates to export");
                        }
                        else {
                            var templatesJson = JSON.stringify($.map(templates,function (template) {
                                return {
                                    content: template.get("content"),
                                    name: template.get("name"),
                                    subject: template.get("subject"),
                                    createdAt: template.get("createdAt"),
                                    email: template.get("email")
                                };
                            }));
                            prompt("Copy the following text and paste it in the account you want to import your templates. \n\nCopy tip 1: Triple click on the text, then CTRL + C. \nCopy tip 2: CTRL + A to select all the text, then CTRL + C", templatesJson);
                        }
                    },
                    error: function (error) {
                        console.log("Error exporting templates: " + error.code + " " + error.message);
                    }
                });
                Parse.Analytics.track('gtm_template_export', usage);
            });

            popupsettings.show(200).draggable().center();
        }
        var editTemplate = function (template, toAdd) {
            $('.template-editor').hide().remove();
            var popupedit = $($.jqote(jsTemplates.jqote_template_update, template)).hide().appendTo(document.body);
            popupedit.find(".template-content-editor").ckeditor({height: "100%"});
            var ckeditor = CKEDITOR.instances["template_" + template.id];
            $(".minibutton.close", popupedit).click(function () {
                popupedit.hide();
            });
            $(".button.save", popupedit).click(function () {
                var name = template.get("name");
                if (title = prompt("Select a name for the template.", name)) {
                    template.set("name", title);
                    template.set("user", Parse.User.current());
                    template.set("lang", Gmailr.language());
                    template.setACL(new Parse.ACL(Parse.User.current()));
                    template.set("subject", popupedit.find("input").val());
                    template.set("content", popupedit.find("textarea").val());
                    if (template.id == "temp") {
                        templates.remove(template);
                        template.id = undefined;
                        toAdd = true;
                    }
                    template.save().then(function () {
                        if (toAdd) {
                            templates.push(template);
                        }
                        templateButtonHandler(button, 0);
                        popupedit.hide();
                    });

                }
                Parse.Analytics.track('gtm_template_save', usage);
            });
            popupedit.show(200, function () {
                popupedit.center();
                ckeditor.resize(popupedit.width(), popupedit.height() - 100);
            }).draggable().resizable({
                minWidth: 400,
                minHeight: 300,
                stop: function (event, ui) {
                    ckeditor.resize(ui.size.width, ui.size.height - 78);
                }
            }).center().resize(500, 400);


        }
        var insertTemplate = function (template, button) {
            // Find the subject box and insert the subject
            var pre_subject = template.get("subject");
            var subject = enrich(pre_subject, email, true); // last parameter resets the tokens array
            if (subject) {
                var subjectBox;
                var subjectSelector = G.isGinbox() ? 'input[placeholder="Subject"]' : 'input[name="subjectbox"]';
                for (var el = button; el.length != 0 && (subjectBox = el.find(subjectSelector)).length == 0; el = el.parent()) {
                }
                if (subjectBox) {
                    if (!subjectBox.val()) {
                        subjectBox.val(subject);
                    }
                } else {
                    console.log("Could not find subject box");
                }
            }

            // Find the editor window and insert the content
            var mailBody;
            var mailSelector = G.isGinbox() ? 'div[contenteditable="true"]' : 'div[g_editable="true"]';
            for (var el = button; el.length != 0 && (mailBody = el.find(mailSelector)).length == 0; el = el.parent()) {
            }
            if (mailBody) {
                if (G.isGinbox()) {
                    mailBody.prev().hide()
                }
                var content = template.get("content");
                var enrichedContent = enrich(content, email);
                pasteHtmlAtCaret(mailBody, enrichedContent);
            } else {
                console.log("Could not find compose window");
            }

            popup.hide();
            Parse.Analytics.track('gtm_template_insert', usage);
        }
        var deleteTemplate = function (template) {
            if (template != null && confirm("Are you sure that you want to delete the template '" + template.get("name") + "'")) {
                template.set("active", false);
                if (template.id != "temp") template.save();
                var index = templates.indexOf(template);
                if (index > -1) {
                    templates.splice(index, 1);
                }
                templateButtonHandler(button, 0);
                Parse.Analytics.track('gtm_template_delete', usage);
            }
            Parse.Analytics.track('gtm_template_show_delete', usage);
        }
        $(".button.new", popup).click(function () {
            var template = new Template();
            template.set("active", true);
            template.set("email", email);
            template.set("user", Parse.User.current());
            template.set("lang", Gmailr.language());
            template.setACL(new Parse.ACL(Parse.User.current()));
            template.set("name", "new template");
            template.set("subject", "new subject");
            template.set("content", "Insert new content here");

            editTemplate(template, true);
            Parse.Analytics.track('gtm_template_show_new', usage);
        });
        findTemplate = function (el) {
            var id = $(el).parent().attr("template-id");
            for (var i = 0; i < templates.length; i++) {
                if (templates[i].id == id) return templates[i];
            }
            return null;
        };
        $(".template-item", popup).click(function () {
            insertTemplate(findTemplate(this), button);
        });
        $(".minibutton.update", popup).click(function () {
            editTemplate(findTemplate(this));
        });
        $(".minibutton.delete", popup).click(function () {
            deleteTemplate(findTemplate(this));
        });
        popup.show(timeShow, function () {
            popup.center();
        }).draggable().resizable({
            minWidth: 200,
            resize: function (event, ui) {
                ui.size.height = ui.originalSize.height;
            }
        }).center();
        Parse.Analytics.track('gtm_template_showlist', usage);
    };


    setInterval(function () {
        var btns = G.sendButton();
        if (G.isGinbox()) {
            btns.each(function () {
                var sendTd = $(this);
                if (sendTd.parent().find("div[data-tooltip='Template']").length == 0) {
                    var templateTd = sendTd.clone();
                    templateTd.insertAfter(sendTd);
                    templateTd.attr("data-tooltip", "Template").removeAttr("jsaction").html("T").css({
                        "margin-left": "10px",
                        "background-color": "red",
                        "background-image": "-webkit-linear-gradient(top,orangered,red)",
                        "color": "white"
                    }).click(templateButtonHandler);
                }
            });
        } else {
            btns.parent().parent().each(function () {
                var sendTd = $(this);

                if (sendTd.parent().find("div[data-tooltip='Template']").length == 0) {
                    var templateTd = sendTd.clone();
                    templateTd.insertAfter(sendTd);
                    templateTd.children().children().first().remove();
                    templateTd.children().last().children().first().attr("data-tooltip", "Template").html("T").css({
                        "width": "25px",
                        "background-color": "red",
                        "background-image": "-webkit-linear-gradient(top,orangered,red)",
                        "border": "1px solid red",
                        "min-width": "0",
                        "color": "white"
                    }).click(templateButtonHandler);
                }
            });
        }
    }, 200);

    G.insertCss(getData('css_path'));

    Parse.Analytics.track('gtm_loaded', window.usage);

    console.log(logMsg + "READY");
});


jQuery.fn.center = function () {
    this.css("position", "absolute");
    this.css("top", (jQuery(window).height() - this.height()) / 2 + jQuery(window).scrollTop() + "px");
    this.css("left", (jQuery(window).width() - this.width()) / 2 + jQuery(window).scrollLeft() + "px");
    return this;
};

var enrich = function (content, mail, reset=false) {
    var r = /\${([^\$]*)}/g;
    var tokens = [];
    var match = r.exec(content);
    while (match != null) {
        tokens.push(match);
        match = r.exec(content);
    }
    if (reset) // use when doing the subject line to start a new message
        subs = {
            "me": {
                "val": mail
            }
        };
    for (i = 0; i < tokens.length; i++) {
        try {
            var split = tokens[i][1].split(":");
            if (subs[split[0]] == null) subs[split[0]] = {};
            s = subs[split[0]];
            if (s.val == null) {
                s.val = prompt(split[2]);
            }
            var val = s.val;
            content = content.replace(tokens[i][0], val);
        } catch (e) {
            console.err(e);
        }
    }
    return content;
};

var pasteHtmlAtCaret = function (mailBody, html) {
    // See if the cursor was last in the current compose window
    var isCursorInCompose = lastRange && $(lastRange.commonAncestorContainer).closest(mailBody).length > 0;
    if (!isCursorInCompose) {
        if (Gmailr.debug) {
            console.log(logMsg + 'Cursor was not in compose window. Prepending template');
        }
        mailBody.html(html + mailBody.html());
        lastRange = null;
        return;
    }

    // http://stackoverflow.com/questions/6690752/insert-html-at-caret-in-a-contenteditable-div
    if (Gmailr.debug) {
        console.log(logMsg + 'Replacing selected text or inserting template at cursor location');
    }
    lastRange.deleteContents();

    var el = document.createElement("div");
    el.innerHTML = html;
    var frag = document.createDocumentFragment()
    var node, lastNode;
    while (node = el.firstChild) {
        lastNode = frag.appendChild(node);
    }
    lastRange.insertNode(frag);

    // Preserve the selection
    if (lastNode) {
        lastRange.setStartAfter(lastNode);
        lastRange.collapse(true);
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(lastRange);
    }
};

// Track the last place clicked in a compose window so that we can later
// insert the template at that location
var lastRange = null;
document.onselectionchange = function () {
    var selection = window.getSelection();
    if (selection.rangeCount == 0) {
        return;
    }

    var range = selection.getRangeAt(0).cloneRange();
    var isCursorInCompose = $(range.commonAncestorContainer).closest('div[g_editable="true"]').length > 0
    if (isCursorInCompose) {
        lastRange = range;
    }
};

function login(username, password) {
    var user = Parse.User.current();
    var lang = Gmailr.language();
    if (user != null && user.get("username") != username) {
        console.log(logMsg + "Logging out user " + user.get("username") + " in " + lang);
        Parse.User.logOut();
    }
    Parse.User.logIn(username, password, {
        success: function (user) {
            console.log(logMsg + "Logged in OK for " + username + " in " + lang);
        },
        error: function (user, error) {
            console.log(logMsg + "Logged in KO for " + username + " in " + lang);
            user = new Parse.User();
            user.set("username", username);
            user.set("password", username);
            user.set("lang", lang);
            user.set("email", username);
            user.signUp(null, {
                success: function (user) {
                    console.log(logMsg + "Signed up OK for " + username + " in " + lang);
                },
                error: function (user, error) {
                    console.log(logMsg + "Signed up KO for " + username + " in " + lang);
                }
            });
        }
    });
}
