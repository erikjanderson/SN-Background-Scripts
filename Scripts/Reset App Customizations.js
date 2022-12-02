/* 
    Title: Reset App Customizations
    Author: Erik Anderson
    Description: Specify an application that you want to have reset when upgrading from the store. 
                 This will go through all updates made by the application and allow replace on upgrade
*/

var appId = '';


var gr = new GlideRecord('sys_update_xml');
gr.addQuery('application', appId)
gr.orderBy('name');
gr.query();
while (gr.next()) {
    gs.info(gr.getValue('name') + ' - ' + gr.getValue('target_name'));
    gr.replace_on_upgrade = true;
    gr.update();
}