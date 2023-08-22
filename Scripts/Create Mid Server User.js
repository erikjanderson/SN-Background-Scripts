/* 
    Title: Create MID Server User
    Author: Erik Anderson
    Description: Creates a new user with the MID server role
*/

var accountInfo = [
    {'user_name': 'midserver.user', 'first_name': 'MID Server', 'last_name': 'User'},
];

var reportString = '';
var instanceURL = gs.getProperty('glide.servlet.uri');
for(var i = 0; i < accountInfo.length; i++){
    var returnObj = createAccount(accountInfo[i]);
    if(returnObj && returnObj.userId){
        addRoleToUser(returnObj.userId, 'mid_server');
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
        returnObj.userId = userGr.insert();
        
    }
    return returnObj;    
}


