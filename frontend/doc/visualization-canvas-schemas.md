Visualization Canvas Schemas
===

Visualization Canvas is a new version of Data Lens.  It still has the same display type
(`data_lens`) and stores metadata in the same place (the `displayFormat` key of views), but instead
has a `visualizationCanvasMetadata` key in lens display format.  The schema is versioned to make it
easier to introduce breaking changes in the metadata structure.  A list of known schema versions
along with their structure is as follows:

Version 1
---

```
visualizationCanvasMetadata: {
  version: 1,
  vifs: [{VIF}], // an array of VIF objects, see frontend-visualizations for the VIF spec
  filters: [{filter}] // an array of filter objects, see the VIF spec for the structure
}
```
