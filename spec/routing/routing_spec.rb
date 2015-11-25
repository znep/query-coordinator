require 'rails_helper'
require_relative '../../test/test_helper'
require_relative '../../lib/constraints/data_lens_constraint'

RSpec.describe 'routes for Data Lens' do

  let(:datalens_matching_datalens_constraint_params) {
    {
      :controller => 'angular',
      :action => 'data_lens',
      :id => '1234-1234',
      :app => 'dataCards'
    }.with_indifferent_access
  }

  let(:datasets_matching_datalens_constraint_params) {
    {
      :controller => 'angular',
      :action => 'data_lens',
      :id => 'not_a_four_by_four'
    }.with_indifferent_access
  }

  let(:dataslate_matching_resource_constraint_params) {
    {
      :controller => 'custom_content',
      :action => 'page',
      :path => 'dickbutt/manbearpig/notfourbyfour'
    }.with_indifferent_access
  }

  it 'routes /view/1234-1234 to the angular_controller data_lens action' do
    allow_any_instance_of(ActionDispatch::Request).to receive(:path_parameters).and_return(datalens_matching_datalens_constraint_params)
    view_double = double
    allow(view_double).to receive(:data_lens?).and_return(true)
    allow(View).to receive(:find).and_return(view_double)
    allow(FeatureFlags).to receive(:derive).and_return(:standalone_lens_chart => false)
    expect(get('/view/1234-1234')).to route_to('angular#data_lens', datalens_matching_datalens_constraint_params)
  end

  it 'routes /dickbutt/manbearpig/1234-1234 to the dataset controller show action (views)' do
    view_double = double
    allow(view_double).to receive(:data_lens?).and_return(false)
    allow(View).to receive(:find).and_return(view_double)
    allow_any_instance_of(ActionDispatch::Request).to receive(:path_parameters).and_return(datasets_matching_datalens_constraint_params)
    expect(get('/manbearpig/dickbutt/1234-1234')).to route_to('datasets#show', datasets_matching_datalens_constraint_params)
  end

  it 'routes /dickbutt/manbearpig/notfourbyfour to the custom_content controller page action (dataslate)' do
    allow_any_instance_of(ActionDispatch::Request).to receive(:path_parameters).and_return(dataslate_matching_resource_constraint_params)
    expect(get('/dickbutt/manbearpig/notfourbyfour')).to route_to('custom_content#page', dataslate_matching_resource_constraint_params)
  end
end
