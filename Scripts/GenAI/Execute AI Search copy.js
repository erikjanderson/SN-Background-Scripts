/* 
    Title: Execute AI Search From Background Script
    Author: Erik Anderson
    Description: Helpful script if you want to execute an AI search from a background script. 
    Is good to validate and test your search indexes
*/


var aisearch = new sn_ais_rag.RAGRetrievalDefinitionUtil()

var inputs = {
    "search_profile": 'x_itsp_now_assis_0_type_classifcation_search_profile',
    "query": "ews",
    "debug": true,
    "facet_filters": [],
    "search_filters": [],
    "pagination_token": null,
    "selected_sort_options": null,
    "locale": "en",
    "force_skip_signals_logging": true,
    "is_debug": true,
    "requested_fields": ["source"],
    "async_params": {},
    "search_purview": "REGULAR"
}

var results = aisearch.execute(inputs);
gs.info(results.search_results);