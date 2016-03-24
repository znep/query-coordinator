require 'test_helper'

class LicenseConfigTest < Test::Unit::TestCase

  def test_all_licenses_are_valid
    # Error checking
    errors = ExternalConfig.for(:license).merged_licenses.values.each do |license_id|
      assert license_id.upcase == license_id, "#{license_id} should be in ALLCAPS because core."
    end
  end
end

