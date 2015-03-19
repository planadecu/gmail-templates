/**
    This is the first script (along with lab.js) that is injected into the top frame of the
    Gmail DOM. 
    
    It loads the dependencies needed for Gmailr (via LAB), and then runs main.js, 
    which is the app code that uses Gmailr.
    
    If you want to get started writing an extension using Gmailr, edit main.js.
    
    If you want to add more files, or change how files are loaded, simply extend the load 
    paths after the LAB call to getData('gmailr_path'). 
    */

// Grabs the data that is injected using addData in bootstrap.js
var getData = function(id) {
	return document.getElementById(id + "_gmailr_data").getAttribute('data-val');
};

var version = getData('extension_version');

// Load all dependencies and run main.js
var wait = 10;
var boot = function(){
	if(typeof $LAB != "undefined"){
		$LAB
		.script(getData('parse_path'))
		.script(getData('jquery_path'))
		.script(getData('ckeditor'))
		.wait()
		.script(getData('jquery_bbq_path'))
		.script(getData('jquery_jqote2'))
		.script(getData('jquery_ui'))
		.script(getData('ckeditor_jquery'))
		.wait()
		.script(getData('gmailr_path'))
		.wait()
		.script(getData('main_path'));
	}else{
		console.log("## Gmail Template Manager: Waiting $LAB to load " + wait + " ms");
		setTimeout(boot,wait);
		wait *= 2;
	}
};

boot();