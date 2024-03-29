/* 
    Title: Convert My List Views To Global
    Author: Erik Anderson
    Description: Pretty simple script but helpful to run periodically. It just finds all your personalized list views and makes sure they are captured outside of a scoped application.
*/

var uiListGr = new GlideRecord('sys_ui_list');
uiListGr.addQuery("sys_user", gs.getUserID());
uiListGr.addEncodedQuery("sys_scope!=global^ORsys_scope=NULL");
uiListGr.addQuery('sys_scope', '!=', 'global');
uiListGr.addQuery('sys_user', gs.getUserID());
uiListGr.query();
while (uiListGr.next()) {
    uiListGr.sys_scope = 'global';
    uiListGr.update();
}
