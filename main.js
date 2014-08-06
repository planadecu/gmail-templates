

console.log("## Gmail Template Manager: LOADING");

Parse.initialize("jPRvej2uwOt81eNXBVrQjT1f5uK6oGSR5qOccspM", "C5cyoGmfyOY2kh06zRVJW7hLWhwsHsdOV5aJD9S7");

var usage = {
  timestamp: "" + new Date().getTime()
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
    var Template = Parse.Object.extend("Template");
    var Templates = Parse.Collection.extend({
      model: Template
    });
    var templates = new Templates();
    var query = new Parse.Query(Template);
    query.equalTo("email", email).equalTo("active", true);
    templates = query.collection();
    templates.fetch({
        success:function(templates){
            if(templates.length==0){
                var template = new Template();
                template.set("content","Dear #name#, This is a sample template.");
                template.set("email",email);
                template.set("name","Welcome template");
                template.set("active",true);
                template.id = "temp";
                templates.add(template);
            }
        }
    });

	var templateTrigger = function(){

        $('.template-list').hide().remove();
        var popup = $($.jqote(jsTemplates.jqote_template_list,templates)).hide().appendTo(document.body);
        $(".minibutton.close",popup).click(function(){
           popup.hide();
        });

        var editTemplate = function(template,toAdd){
            $('.template-editor').hide().remove();
            var popupedit = $($.jqote(jsTemplates.jqote_template_update,template)).hide().appendTo(document.body);
            popupedit.find("textarea").ckeditor();
            $(".minibutton.close",popupedit).click(function(){
                popupedit.hide();
            });
            $(".button.save",popupedit).click(function(){
                var name = template.get("name");
                if(title=prompt("Select a name for the template.",name)){
                    template.set("content",popupedit.find("textarea").val());
                    template.set("name",title);
                    if(template.id=="temp"){
                        templates.remove(template);
                        template.id = undefined;
                        toAdd = true;
                    }
                    template.save().then(function(){
                        if(toAdd) templates.add(template);
                        templateTrigger();
                        popupedit.hide();
                    });

                }
                Parse.Analytics.track('gtm_template_save', usage);
            });
            popupedit.center().show(200);

        }
        var insertTemplate = function(template){
            var content = template.get("content");
            $(".gmail_default").html(content);
            popup.hide();
            Parse.Analytics.track('gtm_template_insert', usage);
        }
        var deleteTemplate = function(template){
            if(confirm("Are you sure that you want to delete the template '"+template.get("name")+"'")){
                template.set("active",false);
                if(template.id!="temp") template.save();
                templates.remove(template);
                templateTrigger();
                Parse.Analytics.track('gtm_template_delete', usage);
            }
            Parse.Analytics.track('gtm_template_show_delete', usage);
        }
        $(".button.new",popup).click(function(){
            var template = new Template();
            template.set("content","Insert new content here");
            template.set("email",email);
            template.set("name","new template");
            template.set("active",true);

            editTemplate(template,true);
            Parse.Analytics.track('gtm_template_show_new', usage);
        });
        $(".template-item",popup).click(function(){
            insertTemplate(templates.get($(this).parent().attr("template-id")));
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
		var send = G.sendButton().parent().parent();
		if(send.parent().find("div[data-tooltip='Template']").length==0){
			var template = send.clone();
			template.insertAfter(send);
			template.children().children().last().attr("data-tooltip","Template").html("T").css({"width":"20px","background-color":"red","background-image": "-webkit-linear-gradient(top,orangered,red)","border":"1px solid red","min-width":"0"}).click(templateTrigger);
		}
	},200);
 
    G.insertCss(getData('css_path'));

    var usage = {
	  timestamp: "" + new Date().getTime(),
	  email: G.emailAddress()
	};

	Parse.Analytics.track('gtm_loaded', usage);

	console.log("## Gmail Template Manager: READY");
});


jQuery.fn.center = function () {
    this.css("position","absolute");
    this.css("top", ( jQuery(window).height() - this.height() ) / 2+jQuery(window).scrollTop() + "px");
    this.css("left", ( jQuery(window).width() - this.width() ) / 2+jQuery(window).scrollLeft() + "px");
    return this;
}