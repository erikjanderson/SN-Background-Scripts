/* 
    Title: New Instance Script
    Author: Erik Anderson
    Description: Changes instance settings for better developer experience. Meant to be run after a z-boot or new install.
*/

//Extends session timeout to reduce frequency of being logged out automatically
gs.setProperty('glide.ui.session_timeout', 1440);

//Removes warning when changes are made to a record that synced up with source control
gs.setProperty('glide.ui.vcs.collision_avoidance', false);