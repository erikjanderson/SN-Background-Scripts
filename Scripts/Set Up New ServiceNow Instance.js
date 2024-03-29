/* 
    Title: New Instance Script
    Author: Erik Anderson
    Description: Changes instance settings for better developer experience. Meant to be run after a z-boot or new install.
*/

//Extends session timeout to reduce frequency of being logged out automatically
gs.setProperty('glide.ui.session_timeout', 1440);

//Removes warning when changes are made to a record that synced up with source control
gs.setProperty('glide.ui.vcs.collision_avoidance', false);

//Allows users to individually choose if they want to opt into the Next Experience UI
gs.setProperty('glide.ui.polaris.experience', true);
gs.setProperty('glide.ui.polaris.dark_themes_enabled', true);
gs.setProperty('glide.ui.polaris.on_off_user_pref_enabled', true);
//gs.setProperty('glide.ui.polaris.use', false);


//Allow Polaris UI when in studio

var pageThemeGr = new GlideRecord('sys_page_theme');
if(!pageThemeGr.get('name', '$studio')){
    pageThemeGr.initialize();
    pageThemeGr.type = 'page';
    pageThemeGr.name = '$studio';
    pageThemeGr.action = 'allow';
    pageThemeGr.sys_scope = 'global';
    pageThemeGr.insert();
}


//Create a basic auth profile so I can import all of my existing work
var githubUserName = '';
var githubAccessToken = ''
var grBAC = new GlideRecord('basic_auth_credentials');
grBAC.initialize();
grBAC.setDisplayValue('password',githubAccessToken);
grBAC.setValue('user_name',githubUserName);
grBAC.setValue('name','My Github Credentials');
grBAC.setValue('active',true);
grBAC.insert();


//Activate plugins
var plugins = [];
//Integration Hub
plugins.push('com.glide.hub.integrations.enterprise');
//Software Asset Management
plugins.push('com.snc.software_asset_management');
plugins.push('com.snc.sams');
var main = new GlideMultiPluginManagerWorker();
main.setPluginIds(plugins);
main.setProgressName("Plugin Installer");
main.setBackground(true);
main.start();
