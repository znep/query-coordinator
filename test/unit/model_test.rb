require 'test_helper'

class ModelTest < MiniTest::Test

  def test_predicate_methods_return_true
    model = View.new
    model.data = {'newBackend' => true}
    model.update_data = {}
    assert model.newBackend?, 'newBackend? should return true'
    model.data = {}
    model.update_data = {'newBackend' => true}
    assert model.newBackend?, 'newBackend? should return true'
    model.data = {'newBackend' => false}
    assert model.newBackend?, 'newBackend? should return true'
  end

  def test_predicate_methods_return_false
    model = View.new
    model.data = {}
    model.update_data = {}
    refute model.newBackend?, 'newBackend? should return false'
    model.data = {'newBackend' => false}
    refute model.newBackend?, 'newBackend? should return false'
    model.update_data = {'newBackend' => false}
    refute model.newBackend?, 'newBackend? should return false'
    model.data = {'newBackend' => true}
    refute model.newBackend?, 'newBackend? should return false'
  end

  def test_model_does_not_explode_when_given_non_json_response_from_core
    CoreServer::Base.connection.stubs(
      :get_request => '<html><body><h1>503 Service Unavailable</h1> No server is available to handle this request. </body></html>'
    )
    View.find('1234-1234') # Should not raise. If it does, the test fails.
  end

  def test_predicate_method_matches_non_predicate_method
    model = View.new
    model.data = {'newBackend' => true}
    model.update_data = {}
    assert_equal model.newBackend?, model.newBackend
    model.data = {}
    model.update_data = {'newBackend' => true}
    assert_equal model.newBackend?, model.newBackend
    model.data = {'newBackend' => false}
    assert_equal model.newBackend?, model.newBackend
    model.data = {}
    model.update_data = {}
    assert_equal model.newBackend?, !!model.newBackend
    model.data = {'newBackend' => false}
    assert_equal model.newBackend?, model.newBackend
    model.update_data = {'newBackend' => false}
    assert_equal model.newBackend?, model.newBackend
    model.data = {'newBackend' => true}
    assert_equal model.newBackend?, model.newBackend
  end

end
