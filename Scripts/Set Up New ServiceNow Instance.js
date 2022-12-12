/* 
    Title: New Instance Script
    Author: Erik Anderson
    Description: Changes instance settings for better developer experience. Meant to be run after a z-boot or new install.
*/

//Extends session timeout to reduce frequency of being logged out automatically
gs.setProperty('glide.ui.session_timeout', 1440);

//Removes warning when changes are made to a record that synced up with source control
gs.setProperty('glide.ui.vcs.collision_avoidance', false);


//Create a basic auth profile so i can import all of my existing work
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
plugins.push('com.glide.hub.integrations.enterprise');
plugins.push('sn_sg_dependencies');
var main = new GlideMultiPluginManagerWorker();
main.setPluginIds(plugins);
main.setProgressName("Plugin Installer");
main.setBackground(true);
main.start();
