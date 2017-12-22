export default {
  select_single: '$select=column1',
  select_multi: '$select=column1%2Ccolumn2%2Ccolumn3',
  offset: '$offset=10',
  limit: '$limit=50',
  filter: {
    activeTabFailure: 'activity_type%20in%20(\'DataUpdate.Import.Failure\'%2C\'DataUpdate.Upsert.Failure\'%2C\'DataUpdate.Replace.Failure\'%2C\'DataUpdate.Delete.Failure\'%2C\'DataUpdate.Restore.Failure\'%2C\'DataUpdate.Sync.Failure\'%2C\'DataUpdate.Unknown.Failure\'%2C\'DataUpdate.Append.Failure\'%2C\'DataUpdate.PrepareCuratedRegion.Failure\'%2C\'DataUpdate.AddRegionColumn.Failure\')',
    activeTabDeleted: 'activity_type%3D\'AssetDeleted\'',
    assetType: 'asset_type%3D\'dataset\'',
    updateEvent: 'activity_type%20in%20(\'DataUpdate.Import.Failure\'%2C\'DataUpdate.Upsert.Failure\'%2C\'DataUpdate.Replace.Failure\'%2C\'DataUpdate.Delete.Failure\'%2C\'DataUpdate.Restore.Failure\'%2C\'DataUpdate.Sync.Failure\'%2C\'DataUpdate.Unknown.Failure\'%2C\'DataUpdate.Append.Failure\'%2C\'DataUpdate.PrepareCuratedRegion.Failure\'%2C\'DataUpdate.AddRegionColumn.Failure\')',
    ordinaryEvent: 'activity_type%3D\'AssetMetadataChanged\'',
    date: '(created_at%20between%20\'2016-01-01T00%3A00%3A00\'%20and%20\'2017-12-12T23%3A59%3A59\')'
  }
};
