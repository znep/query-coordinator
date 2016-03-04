require 'rails_helper'
require 'view_models/administration/georegions'

describe ::ViewModels::Administration::Georegions do

  let(:curated_region) do
    CuratedRegion.new(
      'id' => 1,
      'name' => 'My Curated Region',
      'enabledFlag' => false,
      'defaultFlag' => false
    )
  end
  let(:enabled_region) do
    CuratedRegion.new(
      'id' => 2,
      'name' => 'My Curated Region',
      'enabledFlag' => true,
      'defaultFlag' => false
    )
  end
  let(:default_region) do
    CuratedRegion.new(
      'id' => 3,
      'name' => 'My Curated Region',
      'enabledFlag' => false,
      'defaultFlag' => true
    )
  end
  let(:duplicate_region) do
    CuratedRegion.new(
      'id' => 1,
      'name' => 'My Curated Region',
      'enabledFlag' => false,
      'defaultFlag' => true
    )
  end
  let(:job_in_progress) do
    {
      'common' => {
        'internalId' => 'cur8ed-r3g10n-j0b',
        'externalId' => 'cur8ed-r3g10n-j0b'
      },
      'dataset' => 't3st-d4t4',
      'jobParameters' => {
        'geometryLabel' => 'name',
        'name' => 'Curated Region Job in Progress',
        'enabledFlag' => false,
        'defaultFlag' => false,
        'type' => 'prepare_curated_region'
      }
    }
  end
  let(:failed_job) do
    {
      'id' => 'f41l3d-cur8ed-r3g10n-j0b',
      'activity_type' => 'PrepareCuratedRegion',
      'service' => 'CuratedRegionJob',
      'entity_type' => 'Dataset',
      'entity_id' => 'm0r3-d4t4',
      'status' => 'Failure',
      'latest_event' => {
        'status' => 'Failure',
        'info' => {
          'common' => {
            'internalId' => 'f41l3d-cur8ed-r3g10n-j0b',
            'externalId' => 'f41l3d-cur8ed-r3g10n-j0b'
           },
          'dataset' => 'm0r3-d4t4',
          'jobParameters' => {
            'geometryLabel' => 'name',
            'name' => 'Failed Curated Region Job',
            'enabledFlag' => false,
            'defaultFlag' => false,
            'type' => 'prepare_curated_region'
          }
        }
      }
    }
  end

  let(:site_title) { 'My Site' }
  subject do
    ::ViewModels::Administration::Georegions.new(
      [curated_region, enabled_region, default_region],
      [job_in_progress],
      [failed_job],
      site_title
    )
  end
  before(:each) do
    allow_any_instance_of(CuratedRegion).to receive(:primary_key_columns).and_return(nil)
    allow_any_instance_of(CuratedRegion).to receive(:geometry_label_columns).and_return(nil)
  end

  it 'calculates default count' do
    expect(subject.default_count).to eq(1)
  end

  it 'calculates available count' do
    expect(subject.available_count).to eq(3)
  end

  it 'has a maximum_default_count' do
    expect(subject.maximum_default_count).to eq(5)
  end

  it 'has curated regions' do
    expect(subject.curated_regions).to include(curated_region, enabled_region, default_region)
  end

  it 'has jobs in progress' do
    expect(subject.curated_region_jobs).to include(job_in_progress)
  end

  it 'has recent failed jobs' do
    expect(subject.failed_curated_region_jobs).to include(failed_job)
  end

  it 'has translations' do
    expect(subject.translations).to be_an_instance_of(LocalePart)
  end

  it 'has a site title' do
    expect(subject.site_title).to eq(site_title)
  end

  it 'filters out elements with duplicate ids' do
    subject_with_duplicate_item = ::ViewModels::Administration::Georegions.new(
      [curated_region, duplicate_region],
      [job_in_progress],
      [failed_job],
      site_title
    )
    expect(subject_with_duplicate_item.curated_regions).to eq([curated_region])
  end

end
