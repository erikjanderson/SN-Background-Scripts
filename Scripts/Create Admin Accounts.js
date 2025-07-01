/* 
    Title: Create Admin Accounts
    Author: Erik Anderson
    Description: Creates user accounts based on the account info array and gives all users the admin and security admin role.
                 NOTE: elevated permissions must be activated while running this script for security admin to be assigned.
*/

var accountInfo = [
    {'user_name': 'john.doe', 'first_name': 'John', 'last_name': 'Doe', 'email': "john.doe@example.com"},
];

var reportString = '';
var instanceURL = gs.getProperty('glide.servlet.uri');
for(var i = 0; i < accountInfo.length; i++){
    var returnObj = createAccount(accountInfo[i]);
    if(returnObj && returnObj.userId){
        addRoleToUser(returnObj.userId, 'admin');
        addRoleToUser(returnObj.userId, 'security_admin');
    }
    reportString += '\n' + instanceURL + '\n' + accountInfo[i].user_name;

    if(returnObj.randomPassword){
        reportString += '\n' + returnObj.randomPassword;
    }
}

gs.info(reportString);



function addRoleToUser(userId, roleName){
    var roleId = getRole(roleName);
    gs.info(roleId);
    if(!roleId || !userId){
        return;
    }
    var rolesGr = new GlideRecord('sys_user_has_role');
    rolesGr.addQuery('role', roleId);
    rolesGr.addQuery('user', userId);
    rolesGr.query();
    if(!rolesGr.next()){
        rolesGr.initialize();
        rolesGr.user = userId;
        rolesGr.role = roleId;
        rolesGr.insert();
    }
}

function getRole(roleName){
    var rGr = new GlideRecord('sys_user_role');
    if(rGr.get('name', roleName)){
        return rGr.getUniqueValue();
    }
}

function createAccount(userObj){
    var returnObj = {
        userId: '',
        randomPassword:''
    }
    var userGr = new GlideRecord('sys_user');
    if(userGr.get('user_name', userObj.user_name)){
        returnObj.userId = userGr.getUniqueValue();
    }else{
        returnObj.randomPassword = GlideSecureRandomUtil.getSecureRandomString(12);
        userGr.initialize();
        var keys = Object.keys(userObj);
        for(var i = 0; i < keys.length; i++){
            userGr.setDisplayValue(keys[i], userObj[keys[i]]);
        }
        userGr.setDisplayValue('user_password', returnObj.randomPassword);
        userGr.setDisplayValue('password_needs_reset', true);
        returnObj.userId = userGr.insert();
        
    }
    return returnObj;    
}


