require 'rails_helper'

describe 'layouts/unified' do
  before do
    stub_site_chrome_middleware
  end

  it 'does not make a core request in test mode' do
    stub_current_user
    render
    expect(rendered).to match('<footer id="site-chrome-footer"')
  end
end
