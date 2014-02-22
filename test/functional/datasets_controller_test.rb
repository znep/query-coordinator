require 'test_helper'

class DatasetsControllerTest < ActionController::TestCase

  def setup
    init_core_session
    init_current_domain
    @user = login
    @view = View.new(
      'resourceName' => 'resource-name',
      'id' => 'four-four'
    )
    @controller.stubs(:get_view => @view)
    @params = { :foo => 'foo', :bar => 'bar' }
    default_url_options[:host] = @request.host
  end

  # https://opendata.test-socrata.com/dataset/28-Formwidtest/zwjk-24g6.json?text=1
  # should redirect to https://opendata.test-socrata.com/resource/zwjk-24g6.json?text=1
  test 'redirects to format URLs include query string parameters' do
    get :show, { :id => @view.id, :format => 'json' }.merge(@params)
    assert_redirected_to resource_url({:id => @view.id, :format => 'json'}.merge(@params.except('controller')))
  end

end
