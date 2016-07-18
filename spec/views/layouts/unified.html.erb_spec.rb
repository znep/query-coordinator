require 'rails_helper'

describe 'layouts/unified' do

  it 'does not make a core request in test mode' do
    render

    expect(rendered).to match('Link G with a super long title!!!')
    expect(rendered).to match('<a class="footer-link" href="http://www.socrata.com/terms-of-service">Terms of Service</a>')
  end
end
