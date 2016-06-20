// These statuses come from a variety of sources:
// - 'disabled' and 'enabled' come from a specific curated region
// - 'Failure' comes from ImportStatusService
// - 'progress' comes from CuratedRegionJob
const Status = {
  DISABLED: 'disabled',
  ENABLED: 'enabled',
  FAILED: 'Failure',
  PROGRESS: 'progress'
};

export default Status;
