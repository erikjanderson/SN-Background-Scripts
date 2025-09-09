/* 
    Title: Create Embedded Help Article for Guided Setup Step
    Author: Erik Anderson
    Description: 
*/


var guidedSetupContentSysId = "";


var gswContentGr = new GlideRecord('gsw_content_information');
if (gswContentGr.get(guidedSetupContentSysId)) {
	var embeddedHelpGr = new GlideRecord('sys_embedded_help_content');
	embeddedHelpGr.name = gswContentGr.getValue('title');
	embeddedHelpGr.qualifier = gswContentGr.getValue('embedded_help_qualifier');
	embeddedHelpGr.version = 'all';
	embeddedHelpGr.modifier = 'setup';
	embeddedHelpGr.sys_scope = gs.getCurrentApplicationId();

	var url = gswContentGr.getValue('end_point');
	url = url.match(/^(.+?)\./g).toString();
	url = url.substring(0, url.length - 1);
	if (url.startsWith('/')) {
		url = url.slice(1);
	}
	embeddedHelpGr.page = url;

	var content = '';
	var title = '<h1 class="title topictitle1">' + gswContentGr.getValue('title') + '</h1>';
	content = title + gswContentGr.getValue('article');
	embeddedHelpGr.content = content;

	embeddedHelpGr.insert();
}


