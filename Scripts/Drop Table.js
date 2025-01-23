/* 
    Title: Drop Table
    Author: Erik Anderson
    Description: Nothing Special. Just drops a table that you specify. 
    Sometimes deleting a table takes longer that the UI allows and it times you out
*/

var tu = new TableUtils();
tu.dropTableAndExtensions("table_that_will_be_lost_forever");