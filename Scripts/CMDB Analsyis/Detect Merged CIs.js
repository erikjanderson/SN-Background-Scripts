/* 
    Title: Detect Merged CIs
    Author: Erik Anderson
    Description: Queries the Source [sys_object_source] table to determine if a multiple source devices have merged into a single ServiceNow CI.
    This can cause issues later on where a device may be changing "identify" where all of its attributes will randomly flip back and forth after a source imports.
*/


