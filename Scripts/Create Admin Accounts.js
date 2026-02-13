/* 
    Title: Create Admin Accounts
    Author: Erik Anderson
    Description: Creates user accounts based on the account info array and gives all users the admin and security admin role.
                 NOTE: elevated permissions must be activated while running this script for security admin to be assigned.
*/

var accountInfo = [
    { 'user_name': 'john.doe', 'first_name': 'John', 'last_name': 'Doe', 'email': "john.doe@example.com" },
];
var reportString = '';
var instanceURL = gs.getProperty('glide.servlet.uri');
for (var i = 0; i < accountInfo.length; i++) {
    generateMissingAccountDetailsFromEmail(accountInfo[i]);
    var returnObj = createAccount(accountInfo[i]);
    returnObj.randomPassword = updateAccountPassword(accountInfo[i]);
    if (returnObj && returnObj.userId) {
        addRoleToUser(returnObj.userId, 'admin');
        addRoleToUser(returnObj.userId, 'security_admin');
    }
    reportString += '\n' + instanceURL + '\n' + accountInfo[i].user_name;
    if (returnObj.randomPassword) {
        reportString += '\n' + returnObj.randomPassword;
    }
}

gs.info(reportString);



function addRoleToUser(userId, roleName) {
    var roleId = getRole(roleName);
    if (!roleId || !userId) {
        return;
    }
    var rolesGr = new GlideRecord('sys_user_has_role');
    rolesGr.addQuery('role', roleId);
    rolesGr.addQuery('user', userId);
    rolesGr.query();
    if (!rolesGr.next()) {
        rolesGr.initialize();
        rolesGr.user = userId;
        rolesGr.role = roleId;
        rolesGr.insert();
    }
}

function getRole(roleName) {
    var rGr = new GlideRecord('sys_user_role');
    if (rGr.get('name', roleName)) {
        return rGr.getUniqueValue();
    }
}

function createAccount(userObj) {
    var returnObj = {
        userId: '',
        randomPassword: ''
    }
    var userGr = new GlideRecord('sys_user');
    if (userGr.get('user_name', userObj.user_name)) {
        returnObj.userId = userGr.getUniqueValue();
    } else {
        //returnObj.randomPassword = GlideSecureRandomUtil.getSecureRandomString(12);
        userGr.initialize();
        var keys = Object.keys(userObj);
        for (var i = 0; i < keys.length; i++) {
            userGr.setDisplayValue(keys[i], userObj[keys[i]]);
        }
        // userGr.setDisplayValue('user_password', returnObj.randomPassword);
        // userGr.setDisplayValue('password_needs_reset', true);
        returnObj.userId = userGr.insert();
    }
    return returnObj;
}

function updateAccountPassword(userObj) {
    var randomPassword = SNC.PasswordPolicyEvaluator.generateUserPassword(userObj.user_name);
    var userGr = new GlideRecord('sys_user');
    if (userGr.get("user_name", userObj.user_name)) {
        userGr.setDisplayValue('user_password', randomPassword);
        userGr.setDisplayValue('password_needs_reset', true);
        userGr.update()
    }
    return randomPassword;
}

function generateMissingAccountDetailsFromEmail(accountInfo) {
    var email = accountInfo.email;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return null;
    }
    // Get everything before the @
    var username = email.split('@')[0];
    // Split on dots
    var parts = username.split('.').filter(Boolean);
    if (parts.length === 0) {
        return null;
    }
    // First name = first segment
    var firstNameRaw = parts[0];
    // Last name = last segment
    var lastNameRaw = parts.length > 1 ? parts[parts.length - 1] : '';
    // Capitalization helper
    function capitalize(name) {
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }
    if(gs.nil(accountInfo.user_name)){
        accountInfo.user_name = username;
    }
    if(gs.nil(accountInfo.first_name)){
        accountInfo.first_name = capitalize(firstNameRaw);
    }
    if(gs.nil(accountInfo.last_name)){
        accountInfo.last_name = lastNameRaw ? capitalize(lastNameRaw) : '';
    }
}