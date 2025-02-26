/* 
    Title: Execute AI Search From Background Script
    Author: Erik Anderson
    Description: Helpful script if you want to execute an AI search from a background script. 
    Is good to validate and test your search indexes
*/

var aiSearch = new global.AISearchDefinitionUtil();

var inputs = {
    "search_context_config_id": "",//sys_search_context_config
    "search_term": "your_search_term",
    "disable_spell_check": false,
    "facet_filters": [],
    "search_filters": [],
    "pagination_token": null,
    "selected_sort_options": null,
    "locale": "en",
    "force_skip_signals_logging": true,
    "is_debug": true,
    "requested_fields": {},
    "async_params": {},
    "search_purview": "REGULAR"
}

var results = aiSearch.execute(inputs);
gs.info(results.search_results);