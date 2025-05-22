/* 
    Title: Capture GlideRecords as Metadata Snapshots
    Author: Erik Anderson
    Description: Convenance script to automate capturing any kind of record in ServiceNow as a Metadata Snapshot.
    Below is an example that will capture attachments as metadata snapshots, but this could be used for anything.
*/

var scope = gs.getCurrentApplicationId();

/* 
	update (New Install and Upgrades)
	unload (New Install only)
	unload.demo (New Install With Demo Data) 
*/
var directory = "update";



var gr = new GlideRecord("sys_attachment");
gr.addQuery("table_name", "sys_data_source");
gr.addQuery("sys_scope", scope)
gr.query();
while(gr.next()){
	createMetadataSnapshot(gr, directory);

	var attachmentDocGr = new GlideRecord("sys_attachment_doc");
	attachmentDocGr.addQuery("sys_attachment", gr.getUniqueValue());
	attachmentDocGr.query();
	while(attachmentDocGr.next()){
		createMetadataSnapshot(attachmentDocGr, directory);
	}
}




function createMetadataSnapshot(gr, directory) {
	var serializedXML = gs.unloadRecordToXML(gr, true);
	var metadataLinkGr = new GlideRecord("sys_metadata_link");
	metadataLinkGr.addQuery("sys_scope", scope);
	metadataLinkGr.addQuery("documentkey", gr.getUniqueValue());
	metadataLinkGr.query();
	var metadataAlreadyExists = metadataLinkGr.next();
	if(!metadataAlreadyExists){
		metadataLinkGr.initialize();
	}
	metadataLinkGr.tablename = gr.getTableName();
	metadataLinkGr.documentkey = gr.getUniqueValue();
	metadataLinkGr.directory = directory;
	metadataLinkGr.payload = serializedXML;
	metadataLinkGr.sys_scope = scope;

	if(!metadataAlreadyExists){
		metadataLinkGr.insert();
	}else{
		metadataLinkGr.update();
	}

}