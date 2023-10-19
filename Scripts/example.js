

//Activate plugins
var plugins = [];
plugins.push('com.glide.now.platform.encryption');
var main = new GlideMultiPluginManagerWorker();
main.setPluginIds(plugins);
main.setProgressName("Plugin Installer");
main.setBackground(true);
main.start();
