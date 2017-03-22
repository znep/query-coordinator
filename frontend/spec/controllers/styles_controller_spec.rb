require 'rails_helper'

describe StylesController do
  include TestHelperMethods

  before do
    init_core_session
    init_current_domain
    init_signaller
  end

  describe 'fetching merged stylesheets' do
    it 'should strip BOM' do
      filename = 'test'
      path = "#{Rails.root}/app/styles/#{filename}.scss"

      allow(File).to receive(:exist?).with(path).and_return(true)
      allow(File).to receive(:read).with(path).and_return("\xEF\xBB\xBFbody.scss { width: 100%; }")
      allow(subject).to receive(:get_includes).and_return('')

      stub_const('STYLE_PACKAGES', { 'test_package' => [filename, filename] })

      get :merged, { stylesheet: 'test_package' }
      expect(response.code.to_i).to eq(200)

      rendered = subject.send(:render_merged_stylesheets, '')
      expect(rendered).to eq("body.scss{width:100%}body.scss{width:100%}\n")
    end
  end
end
