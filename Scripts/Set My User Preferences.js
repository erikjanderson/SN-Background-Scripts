
var userId = gs.getUserID();

createUserPreference("glide.ui.polaris.theme.variant", "e09ef7ae07103010e03948f78ad3002c", userId);
createUserPreference("glide.ui.date_format", '{"timeAgo":false,"dateBoth":true}', userId);
createUserPreference("glide.ui.polaris.ui16_tabs_inside_polaris", "true", userId);


function createUserPreference(name, value, userId) {
    if(gs.nil(name) || gs.nil(value) || gs.nil(user)){
        return;
    }
    var userPreferenceGr = new GlideRecord("sys_user_preference");
    userPreferenceGr.addQuery("name", name);
    userPreferenceGr.addQuery("user", userId);
    userPreferenceGr.query();
    if(userPreferenceGr.next()){
        userPreferenceGr.value = value;
        userPreferenceGr.update();
    }else {
        userPreferenceGr.initialize();
        userPreferenceGr.name = name;
        userPreferenceGr.value = value;
        userPreferenceGr.user = userId;
        userPreferenceGr.insert();
    }
}