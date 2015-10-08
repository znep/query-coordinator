require 'rails_helper'
require 'view_models/administration/georegions'

describe ::ViewModels::Administration::Georegions do

  let(:curated_region) { build(:curated_region) }
  let(:enabled_region) { build(:curated_region, :enabled) }
  let(:default_region) { build(:curated_region, :default) }
  let(:site_title) { 'My Site' }
  subject { ::ViewModels::Administration::Georegions.new([curated_region, enabled_region, default_region], site_title) }

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
    expect(subject.default_regions).to eq([default_region])
  end

  it 'has custom regions' do
    expect(subject.custom_regions).to include(curated_region, enabled_region)
    expect(subject.custom_regions).to_not include(default_region)
  end

  it 'has translations' do
    expect(subject.translations).to be_an_instance_of(LocalePart)
  end

  it 'has a site title' do
    expect(subject.site_title).to eq(site_title)
  end

end
