require 'test_helper'

class InternalControllerTest < ActionController::TestCase
  test 'routes to feature flags with or without organization' do
    route_params = {
      org_id: '123',
      domain_id: 'localhost',
      category: 'some+cat',
      controller: 'internal',
      action: 'feature_flags'
    }

    as_url = routelike_builder(route_params)

    assert_routing(
      as_url.call('/internal/orgs/:org_id/domains/:domain_id/feature_flags/:category'),
      route_params
    )
    assert_routing(
      as_url.call("/internal/orgs/:org_id/domains/:domain_id/feature_flags"),
      route_params.except(:category)
    )
    assert_routing(
      as_url.call("/internal/domains/:domain_id/feature_flags/:category"),
      route_params.except(:org_id)
    )
    assert_routing(
      as_url.call("/internal/domains/:domain_id/feature_flags"),
      route_params.except(:category, :org_id)
    )
  end

  test 'show domain with or without organization' do
    route_params = {
      org_id: '123',
      domain_id: 'localhost',
      controller: 'internal',
      action: 'show_domain'
    }

    as_url = routelike_builder(route_params)

    assert_routing(
      as_url.call('/internal/orgs/:org_id/domains/:domain_id'),
      route_params
    )
    assert_routing(
      as_url.call('/internal/domains/:domain_id'),
      route_params.except(:org_id)
    )
  end

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

  test '#set_feature_flags does not require feature_flags param' do
    init_for_feature_flags

    post(:set_feature_flags, domain_id: 'localhost',
                             reset_to_default: { 'new_charts' => true },
                             format: 'data')
    assert(JSON.parse(@response.body)['errors'].empty?)
  end

  test '#set_feature_flags does not require reset_to_default param' do
    init_for_feature_flags

    post(:set_feature_flags, domain_id: 'localhost',
                             format: 'data')
    assert(JSON.parse(@response.body)['errors'].empty?)
  end

  private
  def init_for_feature_flags
    init_current_domain
    Domain.stubs(:find => @domain)
    pretend_to_be_superadmin

    stub_request(:post, "http://localhost:8080/batches").
      to_return(:status => 200, :body => [{ no_idea: 'what goes here' }].to_json, :headers => {})
  end

  def pretend_to_be_superadmin
    init_current_user(@controller)
    @controller.current_user.stubs(:flag? => true)
  end
end
