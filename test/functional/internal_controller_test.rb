require 'test_helper'

class InternalControllerTest < ActionController::TestCase

  def setup
    stub_site_chrome
  end

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

  test '#set_feature_flags does not make changes to a config with the wrong cname' do
    init_for_feature_flags

    @domain.instance_variable_get(:@default_configs)['feature_flags'].data['domainCName'] = 'not.localhost'

    Configuration.expects(:create).once.returns(Hashie::Mash.new.tap { |hashie| hashie.properties = {} })
    post(:set_feature_flags, domain_id: 'localhost', format: 'data')
  end

  test '#set_feature_flags does make changes to a config with the same cname' do
    init_for_feature_flags

    Configuration.expects(:create).never
    post(:set_feature_flags, domain_id: 'localhost', format: 'data')
  end

  test '#set_feature_flags does not require feature_flags param' do
    init_for_feature_flags

    post(:set_feature_flags, domain_id: 'localhost', reset_to_default: { 'new_charts' => true }, format: 'data')
    assert(JSON.parse(@response.body)['errors'].empty?)
  end

  test '#set_feature_flags does not require reset_to_default param' do
    init_for_feature_flags

    post(:set_feature_flags, domain_id: 'localhost', format: 'data')
    assert(JSON.parse(@response.body)['errors'].empty?)
  end

  test 'clears cached values on save' do
    init_for_feature_flags

    stub_request(:get, 'http://localhost:8080/configurations.json?defaultOnly=true&merge=true&type=locales').
      with(:headers => request_headers).to_return(:status => 200, :body => ['en'].to_json, :headers => {})

    stub_request(:get, 'http://localhost:8080/configurations.json?defaultOnly=true&merge=true&type=feature_flags').
      with(:headers => request_headers).to_return(:status => 200, :body => mock_feature_flags_response, :headers => {})

    post(:set_feature_flags, domain_id: 'localhost', feature_flags: { 'enable_new_account_verification_email' => false }, format: 'data')
    assert(JSON.parse(@response.body)['errors'].empty?)
    refute(FeatureFlags.derive['enable_new_account_verification_email'])

    stub_request(:get, 'http://localhost:8080/configurations.json?defaultOnly=true&merge=true&type=feature_flags').
      with(:headers => request_headers).to_return(:status => 200, :body => mock_feature_flags_response(true), :headers => {})

    post(:set_feature_flags, domain_id: 'localhost', feature_flags: { 'enable_new_account_verification_email' => true }, format: 'data')
    assert(JSON.parse(@response.body)['errors'].empty?)
    assert(FeatureFlags.derive['enable_new_account_verification_email'])
  end

  private

  def init_for_feature_flags
    init_current_domain
    Domain.stubs(:find => @domain)
    pretend_to_be_superadmin

    stub_request(:post, 'http://localhost:8080/batches').
      to_return(:status => 200, :body => [{ no_idea: 'what goes here' }].to_json, :headers => {})
  end

  def pretend_to_be_superadmin
    init_current_user(@controller)
    @controller.current_user.stubs(:flag? => true)
    @controller.stubs(:check_auth => true)
  end

  def mock_feature_flags_response(state = false)
    %Q([{
      "id" : 16,
      "name" : "Feature Flags",
      "default" : true,
      "domainCName" : "localhost",
      "type" : "feature_flags",
      "updatedAt" : 1463760268,
      "properties" : [{
        "name" : "zealous_dataslate_cache_expiry",
        "value" : "false"
      }, {
        "name" : "enable_new_account_verification_email",
        "value" : "#{state}"
      }]
    }])
  end

end
