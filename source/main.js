
var logMsg = "## Gmail Template Manager " + version + ": ";
console.log(logMsg + "LOADING...");

Parse.initialize("jPRvej2uwOt81eNXBVrQjT1f5uK6oGSR5qOccspM", "C5cyoGmfyOY2kh06zRVJW7hLWhwsHsdOV5aJD9S7");

var usage = {
  "version": version
};

Parse.Analytics.track('gtm_loading', usage);

var loadTemplate = function(name,context){
    var req = new XMLHttpRequest();
    req.open("GET",getData(name), true);
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            if(typeof context =="undefined") context = window;
            context[name] = req.responseText;
        }
    };
    req.send(null);
};
var jsTemplates = {};
loadTemplate('jqote_template_list',jsTemplates);
loadTemplate('jqote_template_update',jsTemplates);

Gmailr.debug = false; // Turn verbose debugging messages on 

Gmailr.init(function(G) {
    var email = Gmailr.emailAddress();
	login(email,email);
    var Template = Parse.Object.extend("Template");
    var Templates = Parse.Collection.extend({
      model: Template
    });
    var templates = new Templates();
    templates.comparator = function(object) {
      return object.get("name").toLowerCase();
    };
    var query = new Parse.Query(Template);
    query.equalTo("email", email).equalTo("active", true);
    templates.query = query;
    templates.fetch({
        success: function(templates) {
            if (templates.length == 0) {
                var template = new Template();
                template.set("active", true);
                template.set("email", email);
				template.set("user", Parse.User.current());
				template.setACL(new Parse.ACL(Parse.User.current()));
                template.set("name", "Welcome template");
                template.set("subject", "Invoice reminder");
                template.set("content", "Dear ${1:text:Insert name},<br/><br/>The total amount of your invoice is USD ${3:number:Total budget} that you can pay via wire tranfer to the following bank account: ${2:text:Bank account number}<br/> <br/> The invoice will be done with name: ${1}<br/> <br/>Yours faithfully,<br/>${me}<br/>");
                template.id = "temp";
                templates.add(template);
            }
        }
    });

    var templateButtonHandler = function(button){
        if(!button || button.jQuery==null){
            button = $(this);
        }
        $('.template-list').hide().remove();
        var popup = $($.jqote(jsTemplates.jqote_template_list, templates)).hide().appendTo(document.body);
        $(".minibutton.close",popup).click(function(){
           popup.hide();
        });

        var editTemplate = function(template, toAdd) {
            $('.template-editor').hide().remove();
            var popupedit = $($.jqote(jsTemplates.jqote_template_update, template)).hide().appendTo(document.body);
            popupedit.find(".template-content-editor").ckeditor();
            $(".minibutton.close",popupedit).click(function() {
                popupedit.hide();
            });
            $(".button.save",popupedit).click(function() {
                var name = template.get("name");
                if (title = prompt("Select a name for the template.", name)) {
                    template.set("name", title);
					template.set("user", Parse.User.current());
					template.setACL(new Parse.ACL(Parse.User.current()));
                    template.set("subject", popupedit.find("input").val());
                    template.set("content", popupedit.find("textarea").val());
                    if (template.id == "temp") {
                        templates.remove(template);
                        template.id = undefined;
                        toAdd = true;
                    }
                    template.save().then(function() {
                        if(toAdd) {
                          templates.add(template);
                        }
                        templateButtonHandler(button);
                        popupedit.hide();
                    });

                }
                Parse.Analytics.track('gtm_template_save', usage);
            });
            popupedit.center().show(200);

        }
        var insertTemplate = function(template, button){
            // Find the subject box and insert the subject
            var subject = template.get("subject");
            if (subject) {
              var subjectBox;
              for (var el = button; el.length != 0 && (subjectBox = el.find('input[name="subjectbox"]')).length == 0; el = el.parent()) {}
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
            for (var el = button; el.length != 0 && (mailBody = el.find('div[g_editable="true"]')).length == 0; el = el.parent()) {}
            if (mailBody) {
              var content = template.get("content");
              var enrichedContent = enrich(content, email);
              pasteHtmlAtCaret(mailBody, enrichedContent);
            } else {
              console.log("Could not find compose window");
            }

            popup.hide();
            Parse.Analytics.track('gtm_template_insert', usage);
        }
        var deleteTemplate = function(template){
            if(confirm("Are you sure that you want to delete the template '"+template.get("name")+"'")){
                template.set("active",false);
                if(template.id!="temp") template.save();
                templates.remove(template);
                templateButtonHandler(button);
                Parse.Analytics.track('gtm_template_delete', usage);
            }
            Parse.Analytics.track('gtm_template_show_delete', usage);
        }
        $(".button.new", popup).click(function(){
            var template = new Template();
            template.set("active", true);
            template.set("email", email);
			template.set("user", Parse.User.current());
			template.setACL(new Parse.ACL(Parse.User.current()));
            template.set("name", "new template");
            template.set("content", "Insert new content here");
 
            editTemplate(template,true);
            Parse.Analytics.track('gtm_template_show_new', usage);
        });
        $(".template-item",popup).click(function(){
            insertTemplate(templates.get($(this).parent().attr("template-id")),button);
        });
        $(".minibutton.update",popup).click(function(){
            editTemplate(templates.get($(this).parent().attr("template-id")));
        });
        $(".minibutton.delete",popup).click(function(){
            deleteTemplate(templates.get($(this).parent().attr("template-id")));
        });
        popup.center().show(200);
        Parse.Analytics.track('gtm_template_showlist', usage);
    };
    setInterval(function(){
        G.sendButton().parent().parent().each(function(){
            var sendTd = $(this);
            if(sendTd.parent().find("div[data-tooltip='Template']").length == 0) {
                var templateTd = sendTd.clone();
                templateTd.insertAfter(sendTd);
                templateTd.children().children().last().attr("data-tooltip","Template").html("T").css({"width":"20px","background-color":"red","background-image": "-webkit-linear-gradient(top,orangered,red)","border":"1px solid red","min-width":"0"}).click(templateButtonHandler);
            }
        });
    },200);
 
    G.insertCss(getData('css_path'));

    var usage = {
      timestamp: "" + new Date().getTime(),
      email: G.emailAddress()
    };

    Parse.Analytics.track('gtm_loaded', usage);

    console.log(logMsg + "READY");
});


jQuery.fn.center = function() {
    this.css("position","absolute");
    this.css("top", ( jQuery(window).height() - this.height() ) / 2+jQuery(window).scrollTop() + "px");
    this.css("left", ( jQuery(window).width() - this.width() ) / 2+jQuery(window).scrollLeft() + "px");
    return this;
};

var enrich = function(content,mail) {
  var r = /\${([^\$]*)}/g;
  var tokens = [];
  var match = r.exec(content);
  while (match != null) {
      tokens.push(match);
      match = r.exec(content);
  }
  var ss = {
    "me":{"val":mail}
  };
  for(i = 0; i < tokens.length; i++){
    try{
      var split = tokens[i][1].split(":");
      if(ss[split[0]]==null) ss[split[0]] = {};
      s = ss[split[0]];
      if(s.val==null){
         s.val = prompt(split[2]);
      }
      var val = s.val;
      content = content.replace(tokens[i][0],val);
    }catch(e){
      console.err(e);
    }
  }
  return content;
};

var pasteHtmlAtCaret = function(mailBody, html) {
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
document.onselectionchange = function() {
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

function login(username,password){
	var user = Parse.User.current();
	if(user!=null && user.get("username")!=username){
		console.log(logMsg + "Logging out user " + user.get("username"));
		Parse.User.logOut();
	}
	Parse.User.logIn(username, password, {
	  success: function(user) {
		console.log(logMsg + "Logged in OK for " + username);
	  },
	  error: function(user, error) {
		console.log(logMsg + "Logged in KO for " + username);
		user = new Parse.User();
		user.set("username", username);
		user.set("password", username);
		user.set("email", username);
		user.signUp(null, {
		  success: function(user) {
			console.log(logMsg + "Signed up OK for " + username);
		  },
		  error: function(user, error) {
			console.log(logMsg + "Signed up KO for " + username);
		  }
		});
	  }
	});
}
