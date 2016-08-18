require 'rails_helper'

describe DataLensController do
  include TestHelperMethods

  let(:view_data) do
    {
      :id => 'test-data',
      :createdAt => 1456530636244,
      :columns => [],
      :name => 'Test-Data',
      :meta_description => 'Test-Test-Data'
    }.with_indifferent_access
  end

  let(:view) { View.new(view_data) }

  before(:each) do
    init_current_domain
    init_core_session
  end

  it 'should render the data_lens template if enabled' do
    allow(FeatureFlags).to receive(:derive).and_return(OpenStruct.new(:enable_flexible_data_lens => true))
    expect(View).to receive(:find).and_return(view)
    get :data_lens, :id => 'test-data', :app => 'dataCards'

    expect(response).to have_http_status(:success)
    expect(response).to render_template(:data_lens)
  end
end
