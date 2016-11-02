require 'rails_helper'

describe LicenseConfig do

  it 'should upcase all license ids for Core compatibility' do
    ExternalConfig.for(:license).merged_licenses.values.each do |license_id|
      expect(license_id).to eql(license_id.upcase)
    end
  end

end
