require 'test_helper'

class InternalControllerTest < ActionController::TestCase
  test 'provided with valid cnames, valid_cname? should return true' do
    assert(@controller.send(:valid_cname?, 'localhost'))
    assert(@controller.send(:valid_cname?, 'example.com'))
    assert(@controller.send(:valid_cname?, 'data.weatherfordtx.gov'))
    assert(@controller.send(:valid_cname?, 'atf-performance-dashboards.demo.socrata.com'))
  end

  test 'provided with invalid cnames, valid_name? should return false' do
    refute(@controller.send(:valid_cname?, 'localhost.'))
    refute(@controller.send(:valid_cname?, 'localhost..com'))
    refute(@controller.send(:valid_cname?, 'http://localhost'))
    refute(@controller.send(:valid_cname?, 'local--host'))
    refute(@controller.send(:valid_cname?, 'felixhernandez@demo.socrata.com'))
    refute(@controller.send(:valid_cname?, 'cityofmadison,demo.socrata.com'))
  end
end
