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

  let(:site_title) { 'My Site' }
  subject { ::ViewModels::Administration::Georegions.new([curated_region, enabled_region, default_region], site_title) }
  before(:each) do
    allow_any_instance_of(CuratedRegion).to receive(:primary_key_columns).and_return(nil)
    allow_any_instance_of(CuratedRegion).to receive(:geometry_label_columns).and_return(nil)
  end

  it 'calculates enabled count' do
    expect(subject.enabled_count).to eq(1)
  end

  it 'calculates available count' do
    expect(subject.available_count).to eq(3)
  end

  it 'has a maximum_enabled_count' do
    expect(subject.maximum_enabled_count).to eq(5)
  end

  it 'has default regions' do
    expect(subject.default_regions).to eq([])
  end

  it 'has custom regions' do
    expect(subject.custom_regions).to include(curated_region, enabled_region, default_region)
  end

  it 'has translations' do
    expect(subject.translations).to be_an_instance_of(LocalePart)
  end

  it 'has a site title' do
    expect(subject.site_title).to eq(site_title)
  end

  it 'filters out elements with duplicate ids' do
    subject_with_duplicate_item = ::ViewModels::Administration::Georegions.new([curated_region, duplicate_region], site_title)
    expect(subject_with_duplicate_item.custom_regions).to eq([curated_region])
  end

end
