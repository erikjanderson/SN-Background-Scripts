var table = 'x_itsp_its_jamf_staging_cmdb_computers';
var sysId = '0cbba290870bc11061b98409cebb35b1';
var scope = 'b1716227dbfb1300c9267b5b8c961969';

var stagingGr = new GlideRecord(table);
var columns = getColumns();
if (stagingGr.get(sysId)) {
    var newStagingGr = new GlideRecord(table);
    newStagingGr.initialize();
    for(var i = 0; i < columns.length; i++){
        var column = columns[i];
        newStagingGr[column] = stagingGr.getValue(column);
    }
    newStagingGr.insert();
}

function getColumns(){
    var columns = [];
    var grSD = new GlideRecord('sys_dictionary');
    grSD.addQuery('name', table);
    grSD.addQuery('sys_scope', scope);
    grSD.query();
    while (grSD.next()) {
        var column = grSD.getValue('element');
        if(column && !column.startsWith('sys')){
            columns.push(column);
        }
    }
    return columns;
}