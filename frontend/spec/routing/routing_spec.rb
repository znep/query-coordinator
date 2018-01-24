require 'rails_helper'
require_relative '../../lib/constraints/data_lens_constraint'

describe 'routes for Data Lens' do
  include TestHelperMethods

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

  before(:each) do
    allow_any_instance_of(Constraints::CatalogLandingPageConstraint).to receive(:matches?).and_return(false)
  end

  it 'routes /view/1234-1234 to the angular_controller data_lens action' do
    allow_any_instance_of(ActionDispatch::Request).to receive(:path_parameters).and_return(datalens_matching_datalens_constraint_params)
    view_double = double
    allow(view_double).to receive(:data_lens?).and_return(true)
    allow(view_double).to receive(:visualization_canvas?).and_return(false)
    allow(View).to receive(:find).and_return(view_double)
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

  describe 'dataset stats routing' do
    it 'routes /category/viewname/1234-1234/stats to the stats action of the datasets controller' do
      expect(get: '/category/viewname/1234-1234/stats').to route_to(
        controller: 'datasets',
        category: 'category',
        view_name: 'viewname',
        action: 'stats',
        id: '1234-1234'
      )
    end

    it 'routes /dataset/four-four/stats to the stats action of the datasets controller' do
      expect(get: '/dataset/four-four/stats').to route_to(
        controller: 'datasets',
        action: 'stats',
        id: 'four-four'
      )
    end

    it 'routes /d/four-four/stats to the stats action of the datasets controller' do
      expect(get: '/d/four-four/stats').to route_to(
        controller: 'datasets',
        action: 'stats',
        id: 'four-four'
      )
    end
  end

  describe 'dataset about routing' do
    it 'routes /category/viewname/1234-1234/about to the about action of the datasets controller' do
      expect(get: '/category/viewname/1234-1234/about').to route_to(
        controller: 'datasets',
        category: 'category',
        view_name: 'viewname',
        action: 'about',
        id: '1234-1234'
      )
    end

    it 'routes /dataset/four-four/about to the about action of the datasets controller' do
      expect(get: '/dataset/four-four/about').to route_to(
        controller: 'datasets',
        action: 'about',
        id: 'four-four'
      )
    end

    it 'routes /d/four-four/about to the about action of the datasets controller' do
      expect(get: '/d/four-four/about').to route_to(
        controller: 'datasets',
        action: 'about',
        id: 'four-four'
      )
    end
  end

  describe 'OpenPerformance goal routes' do
    describe 'goal embed' do
      it('routes /stat/goals/dash-dash/cate-gory/goal-goal/embed to odysseus#chromeless') do
        expect(get: '/stat/goals/dash-dash/cate-gory/goal-goal/embed').to route_to(
          controller: 'odysseus',
          action: 'chromeless',
          goal_id: 'goal-goal',
          dashboard_id: 'dash-dash',
          category_id: 'cate-gory'
        )
      end
    end

    describe 'single goal embed' do
      it('routes /stat/goals/single/goal-goal/embed to odysseus#chromeless') do
        expect(get: '/stat/goals/single/goal-goal/embed').to route_to(
          controller: 'odysseus',
          action: 'chromeless',
          goal_id: 'goal-goal'
        )
      end
    end

    describe 'single goal edit (embedded)' do
      it('routes /stat/goals/single/goal-goal/edit-embed to odysseus#chromeless') do
        expect(get: '/stat/goals/single/goal-goal/embed/edit').to route_to(
          controller: 'odysseus',
          action: 'chromeless',
          goal_id: 'goal-goal'
        )
      end
    end

    describe 'soon-to-be-deprecated' do
      it('routes /stat/goals/dash-dash/cate-gory/goal-goal to odysseus#index') do
        expect(get: '/stat/goals/dash-dash/cate-gory/goal-goal').to route_to(
          controller: 'odysseus',
          action: 'index',
          goal_id: 'goal-goal',
          dashboard_id: 'dash-dash',
          category_id: 'cate-gory'
        )
      end

      it('routes /stat/goals/single/four-four to odysseus#index') do
        expect(get: '/stat/goals/single/four-four').to route_to(
          controller: 'odysseus',
          action: 'index',
          goal_id: 'four-four'
        )
      end
    end

    describe 'classic goal view' do
      it('routes /stat/goals/dash-dash/cate-gory/goal-goal/view to odysseus#classic_goal') do
        expect(get: '/stat/goals/dash-dash/cate-gory/goal-goal/view').to route_to(
          controller: 'odysseus',
          action: 'classic_goal',
          goal_id: 'goal-goal',
          dashboard_id: 'dash-dash',
          category_id: 'cate-gory'
        )
      end

      it('routes /stat/goals/single/four-four/view to odysseus#classic_single_goal') do
        expect(get: '/stat/goals/single/four-four/view').to route_to(
          controller: 'odysseus',
          action: 'classic_single_goal',
          goal_id: 'four-four'
        )
      end
    end

    describe 'classic goal edit' do
      it('routes /stat/goals/dash-dash/cate-gory/goal-goal/edit-classic to odysseus#classic_goal_edit') do
        expect(get: '/stat/goals/dash-dash/cate-gory/goal-goal/edit-classic').to route_to(
          controller: 'odysseus',
          action: 'classic_goal_edit',
          goal_id: 'goal-goal',
          dashboard_id: 'dash-dash',
          category_id: 'cate-gory'
        )
      end

      it('routes /stat/goals/single/four-four/edit-classic to odysseus#classic_single_goal_edit') do
        expect(get: '/stat/goals/single/four-four/edit-classic').to route_to(
          controller: 'odysseus',
          action: 'classic_single_goal_edit',
          goal_id: 'four-four'
        )
      end
    end
  end

  describe 'catalog landing page routing' do
    let(:clp_configuration) do
      double('clp config', properties: {
        'category%3DFun' => {}
      })
    end
    let(:custom_facets) { nil }

    before(:each) do
      init_current_domain
      init_feature_flag_signaller
      stub_feature_flags_with(:enable_catalog_landing_page => true)
      allow_any_instance_of(Constraints::CatalogLandingPageConstraint).
        to receive(:matches?).and_call_original

      allow(CurrentDomain).to receive(:configuration).
        with(:catalog_landing_page).
        and_return(clp_configuration)
      allow(CurrentDomain).to receive(:property).
        with(:custom_facets, :catalog).
        and_return(custom_facets)
    end

    it 'routes a browse page with a catalog query to the CLP controller' do
      expect(get: '/browse?category=Fun').to route_to(
        controller: 'catalog_landing_page',
        action: 'show',
        custom_path: 'browse',
        category: 'Fun'
      )
    end

    it 'routes a browse page without a catalog query to the browse controller' do
      expect(get: '/browse?foo=bar').to route_to(
        controller: 'browse',
        action: 'show',
        foo: 'bar'
      )
    end

    it 'routes a Dataslate page' do
      expect(get: '/some-dataslate-page').to route_to(
        controller: 'custom_content',
        action: 'page',
        path: 'some-dataslate-page'
      )
    end
  end
end
