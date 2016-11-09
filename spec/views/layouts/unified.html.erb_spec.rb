require 'rails_helper'

describe 'layouts/unified' do

  before(:all) do
    Rails.application.config.socrata_site_chrome = SocrataSiteChrome::SiteChrome.new(
      SocrataSiteChrome::DomainConfig.site_chrome_test_configuration
    )
  end

  it 'does not make a core request in test mode' do
    render

    expect(rendered).to match('<a class="logo" href="/"><img alt="test.host" onerror="this.style.display=&quot;none&quot;" src="/socrata_site_chrome/images/socrata-logo-2c-dark.png" /><span class="site-name"></span></a>')
    expect(rendered).to match('<header id="site-chrome-header"')
    expect(rendered).to match('<footer id="site-chrome-footer"')
  end
end
