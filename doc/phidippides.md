Phidippides
===

A massive [Chesterton's Fence](https://en.wikipedia.org/wiki/Wikipedia:Chesterton%27s_fence), full
of barbed wire and stuff.

Bottom-up
---

- All phidippides communication goes through lib/phidippides.rb.  public methods:
  - `fetch_dataset_metadata`
    - `dataset_metadata_controller#show`
      - `/metadata/v1/dataset/:id`
    - `new_ux_bootstrap_controller#bootstrap`
      - `/view/bootstrap/:id`
      - `/dataset/:id/lens/new`
    - `common_metadata_methods#dataset_metadata`
      - dead code
    - `common_metadata_methods#fetch_dataset_metadata`
      - `data_lens_controller#region_coding_status`
        - `/geo/status`
      - `data_lens_controller#preload_metadata`
        - `/view/:id`
        - `/:category/:view_name/:id`
        - `/view/:id/mobile`
        - `/:category/:view_name/:id/mobile`
      - `data_lens_controller#view_vif`
        - `/view/vif`
    - `region_coder#get_job_id`
      - `/geo/status`
  - `update_dataset_metadata`
    - `dataset_metadata_controller#update`
      - `/metadata/v1/dataset/:id` (put)
    - `new_ux_bootstrap_controller#set_default_page`
      - `#generate_and_redirect_to_new_page`
        - theoretically dead code (use_ephemeral_bootstrap feature flag)
  - `set_default_and_available_card_types_to_columns!`
    - `common_metadata_methods#fetch_dataset_metadata`
      - See above
  - `create_dataset_metadata`
    - dead code
  - `fetch_pages_for_dataset`
    - `common_metadata_methods#fetch_pages_for_dataset`
      - `data_lens_controller#preload_metadata`
        - See above
      - `datasets_controller#show`
        - ???
    - `dataset_metadata_controller#index`
      - `/metadata/v1/dataset/:id/pages`
    - `new_ux_bootstrap_controller#bootstrap`
      - theoretically dead code (use_ephemeral_bootstrap feature flag)

### Deduped URLs

- `/view/bootstrap/:id`
  - Bootstrapping Data Lens
- `/view/:id`
  - Rendering Data Lens
- `/view/:id/mobile`
  - Rendering Data Lens mobile
- `/view/vif`
  - Rendering Data Lens Polaroid page
- `/metadata/v1/dataset/:id`
  - `CardDataService.getShapefileDatasetMetadata`
    - Used for adhoc region coding, uses geometryLabel and featurePk
  - `PageDataService.getPageMetadata`
    - Dead code
- `/metadata/v1/dataset/:id/pages`
  - Unused
- `/geo/status`
  - Used for adhoc region coding
    - computationStrategy field on columns

### frontend-visualizations

- Rendering choropleths (geometryLabel and featurePk, both ChoroplethMap and SvgRegionMap)
- Computed column info
- Adhoc region coding (calls `/geo/status` and `/geo/initiate`)

Obvious differences between core and frontend-phiddy payload
---

### Fields missing from core

- core does not provide the "defaultPage" field.
  - does not appear to play an active role in rendering Data Lenses, but used in (old) bootstrap.
- core does not provide the "domain" field.
  - Used sparingly in Data Lens and DLMobile
- core does not provide the "rowDisplayUnit" field.
  - Used extensively, information should be available by other means (something something NBE + syncing)
  - Yeah, phidippides (frontend) pulls this from the OBE (view.metadata.rowLabel)
- core does not provide the "locale" field.
  - Does not appear to be used
- core does not provide the "computationStrategy" field for computed columns.
  - See EN-8359.

### Fields that provide similar information in different formats

- updatedAt is in a different format but core's info should be a superset of phiddy's.
- columns:
  - phidippides provides the columns as an object, core provides them as an array.
  - phidippides provides the "cardinality" for each column.
    - used only for the column chart cardinality warning
  - phidippides provides "fred" and "physicalDatatype" in addition to the dataTypeName and the
    renderTypeName
    - fred does not appear to be used, physicalDatatype is used though
  - phidippides provides the "hideInTable" field for each column.
    - ported from OBE
  - phidippides provides the "isSubcolumn" field
    - brittle logic in lib/common_metadata_methods#flag_subcolumns!
  - phidippides does not provide the "width" field.
  - phidippides does not provide the "id" field.
  - phidippides does not provide the "tableColumnId" field.
- phidppides munges permissions, seems to just provide an "isPublic" flag and a "rights" array, core
  should be a superset.

### Things frontend does on top of phidippides

- Adds the "rowDisplayUnit"
- Adds the "position" to each column
- Adds the "format" to each column (complicated mapping)
- Adds the "dataTypeName" to each column
- Adds the "renderType:Name" to each column
- Adds the "hideInTable" to each column (hidden flag)

Takeaways
---

- geometryLabel, featurePk, and computationStrategy for region coding.
- rowDisplayUnit is important and not included in /api/views for NBE datasets.
- cardinality (only used in old Data Lens add/customize card dialog but is a useful stat that might
  be necessary for some QFB stuff).
- columns are very different:
  - frontend brings in a bunch of stuff from the OBE copy and annotates the columns with this info.
- Be wary of the frontend endpoint for phidippides which performs a number of transformations on the
  phidippides response.
