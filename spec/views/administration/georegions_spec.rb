require 'rails_helper'

describe 'administration/georegions.html.erb' do

  let(:view_model) do
    double(::ViewModels::Administration::Georegions,
      :allow_defaulting? => true,
      :default_count => 4,
      :maximum_default_count => 5,
      :translations => nil,
      :curated_regions => [],
      :curated_region_jobs => [],
      :failed_curated_region_jobs => []
    )
  end
  let(:curated_region_view) { double(View, :createdAt => 1456530636244) }
  let(:enabled_curated_region) do
    CuratedRegion.new(
      'id' => 1,
      'name' => 'My Curated Region',
      'enabledFlag' => true,
      'defaultFlag' => false
    )
  end
  let(:disabled_curated_region) do
    CuratedRegion.new(
      'id' => 2,
      'name' => 'My "Other" %name\'s Curated-Region',
      'enabledFlag' => false,
      'defaultFlag' => false
    )
  end
  let(:curated_region_job) do
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
  let(:failed_curated_region_job) do
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

  before(:each) do
    allow_any_instance_of(ActionView::Helpers::CaptureHelper).to receive(:content_for)
    allow_any_instance_of(Jammit::Helper).to receive(:include_javascripts).and_return('')
    allow_any_instance_of(ApplicationHelper).to receive(:render_translations).and_return('')
    allow_any_instance_of(CuratedRegion).to receive(:view).and_return(curated_region_view)
    stub_template 'administration/_left_nav.html.erb' => ''
  end

  describe 'rendering' do
    before(:each) do
      assign(:view_model, view_model)
      render
    end

    it 'renders' do
      expect(rendered).to include('Manage Spatial Lens')
    end

    it 'renders the available and default counts' do
      expect(rendered).to include('4 of 5', 'boundaries')
    end

    it 'renders the table partial once' do
      expect(view).to render_template(:partial => '_georegions_table', :count => 1)
    end

  end

  describe 'rendering partial' do

    it 'renders the table partial with data' do
      allow(view_model).to receive(:curated_regions).and_return([enabled_curated_region, disabled_curated_region])
      allow(view_model).to receive(:curated_region_jobs).and_return([curated_region_job])
      allow(view_model).to receive(:failed_curated_region_jobs).and_return([failed_curated_region_job])
      assign(:view_model, view_model)

      render
      expect(rendered).to include('My Curated Region')
      expect(rendered).to include('Ready to use')
      expect(rendered).to include('My &quot;Other&quot; %name&#x27;s Curated-Region')
      expect(rendered).to include('Not enabled')
      expect(rendered).to include('Curated Region Job in Progress')
      expect(rendered).to include('Processing')
      expect(rendered).to include('Failed Curated Region Job')
      expect(rendered).to include('Something went wrong...')
    end

    it 'does not render more checkboxes if setting defaults is not allowed' do
      allow(view_model).to receive(:allow_defaulting?).and_return(false)
      allow(view_model).to receive(:curated_regions).and_return([disabled_curated_region])
      assign(:view_model, view_model)

      render
      expect(rendered).to_not include('checked="true"')
    end

  end
end
