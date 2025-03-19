/* 
    Title: Get List of Form Fields
    Author: Erik Anderson
    Description: Generates a structured list of form fields that are present on a table.
    Groups the list of fields by view and form section to keep things organized.
*/

var tableName = "incident" //The table that you want to get form fields for
var view = "" //Optional view name.

var views = {}
var uiElementGr = new GlideRecord('sys_ui_element');
uiElementGr.addQuery("sys_ui_section.name", this.tableName);
// if (!this.view) {
//     uiElementGr.addQuery("sys_ui_section.view", "Default view");
// } else {
//     uiElementGr.addQuery("sys_ui_section.view.name", this.view);
// }
uiElementGr.addQuery("type", "");
uiElementGr.query();
while (uiElementGr.next()) {
    var viewName = uiElementGr.sys_ui_section.view.name + "";
	if(gs.nil(viewName)){
		viewName = "Default view";
	}
    if(!views[viewName]){
        views[viewName] = {};
    }
    var sectionName = uiElementGr.sys_ui_section.getDisplayValue();
    if(!views[viewName][sectionName]){
        views[viewName][sectionName] = [];
    }
    views[viewName][sectionName] .push({
        name: uiElementGr.getValue('element')
    });
}

var outputString = ""

for (var viewName in views){
    outputString += "\n" + viewName;
    for(var sectionName in views[viewName]){
        outputString += "\n\t" + sectionName;
        for(var i = 0; i < views[viewName][sectionName].length; i++){
            outputString += "\n\t\t" + views[viewName][sectionName][i].name;
        }
    }
    
}

gs.info(outputString)
