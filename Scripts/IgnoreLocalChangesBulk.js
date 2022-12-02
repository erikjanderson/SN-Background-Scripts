/* 
    Title: Ignore Local Changes On Remote Update Set (Bulk)
    Author: Erik Anderson
    Description: Simple script designed to go through any update set conflicts and set the status to ignored
*/

var updateSetId = 'update_set_id'

var current = new GlideRecord('sys_update_preview_problem');
current.addQuery('remote_update_set', updateSetId);
current.addQuery('status', '');
current.addQuery('description', 'Found a local update that is newer than this one');
current.query();
while (current.next()) {
    var ppa = new GlidePreviewProblemAction(gs.action, current);
    ppa.ignoreProblem();
}