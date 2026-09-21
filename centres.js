/* Sample list of ECD / childcare centres for name autocomplete.
   Ships empty — the centre-name field behaves as plain free text and every
   response is recorded as a new centre.

   When a sampling frame exists, fill this array in the same shape and name
   matching, auto-fill of centre type and county/district, and the ref_*
   columns on the sheet all start working with no code change:

   window.CENTRE_LIST = [
     { name: "Bright Star ECD Centre",
       type: "centre",
       source: "Isiolo sample",
       fields: { "County": "Isiolo", "Sub-county": "Isiolo North",
                 "Ward": "Wabera", "Category": "Nursery / pre-primary (standalone)",
                 "Latitude": 0.3546, "Longitude": 37.5822 } },
   ]; */
window.CENTRE_LIST = [];
