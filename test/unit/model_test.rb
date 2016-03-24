require 'test_helper'

class ModelTest < MiniTest::Unit::TestCase

  describe 'predicate method' do

    def test_return_true
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

    def test_return_false
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

  end

  describe 'non-predicate method' do

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

end
