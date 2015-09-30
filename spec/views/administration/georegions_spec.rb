require 'rails_helper'

describe 'administration/georegions.html.erb' do

  let(:view_model) do
    double(::ViewModels::Administration::Georegions,
      :allow_enablement? => true,
      :enabled_count => 4,
      :maximum_enabled_count => 5,
      :translations => nil,
      :custom_regions => [],
      :default_regions => []
    )
  end

  before(:each) do
    allow_any_instance_of(ActionView::Helpers::CaptureHelper).to receive(:content_for)
    allow_any_instance_of(Jammit::Helper).to receive(:include_javascripts).and_return('')
    allow_any_instance_of(ApplicationHelper).to receive(:render_translations).and_return('')
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

    it 'renders the available and enabled counts' do
      expect(rendered).to include('You have enabled 4 of 5 available regions')
    end

    it 'renders the table partial twice' do
      expect(view).to render_template(:partial => '_georegions_table', :count => 2)
    end

  end

  describe 'rendering partial' do

    it 'renders the table partial with data' do
      curated_region = CuratedRegion.new(
        'id' => 1,
        'name' => 'My Curated Region',
        'enabledFlag' => true,
        'defaultFlag' => false
      )

      allow(view_model).to receive(:custom_regions).and_return([curated_region])
      assign(:view_model, view_model)

      render
      expect(rendered).to include('My Curated Region')
      expect(rendered).to include('Yes')
    end

    it 'disables the enable button if enablement is not allowed' do
      allow(view_model).to receive(:allow_enablement?).and_return(false)
      curated_region = CuratedRegion.new(
        'id' => 1,
        'name' => 'My Curated Region',
        'enabledFlag' => false,
        'defaultFlag' => false
      )

      allow(view_model).to receive(:custom_regions).and_return([curated_region])
      assign(:view_model, view_model)

      render
      expect(rendered).to include('disabled="disabled"')
      expect(rendered).to include('You have reached the limit of 5 enabled boundaries for this site')
    end

  end
end
