require 'test_helper'

# Uncomment the lines below to run this test in isolation of Rails via command:
#   ruby test/unit/current_domain_test.rb
# Running the test this way is significantly faster since it avoids starting Rails env.

# require 'minitest/autorun'
# require 'mocha/setup'
# $:.unshift('.', './lib')
# require 'current_domain.rb'

# The way the CurrentDomain class handles the differences between symbols and strings
# for hash keys and array members is error prone and should be refactored. TODO RHA
class CurrentDomainTest < MiniTest::Unit::TestCase

  def test_module_enabled_returns_false
    CurrentDomain.class_variable_set('@@current_domain', :modules => [])
    refute CurrentDomain.module_enabled?(:foo_module)
  end

  def test_module_enabled_returns_true
    CurrentDomain.class_variable_set('@@current_domain',
      :modules => [{'name' => 'foo_module'}],
      :data => Hashie::Mash.new.tap { |data| data.feature = ['foo_module'] }
    )
    assert CurrentDomain.module_available?(:foo_module), 'Expected module :foo to be available'
    assert CurrentDomain.module_enabled?(:foo_module), 'Expected module :foo to be enabled'
  end

  def test_module_enabled_does_not_return_nil_when_false_is_expected
    CurrentDomain.class_variable_set('@@current_domain',
      :modules => [{'name' => 'bar_module'}],
      :data => Hashie::Mash.new.tap { |data| data.feature = ['bar_module'] }
    )
    # It appears that Hashie::Mash sometimes returns nil for predicate methods (i.e. feature? method)
    CurrentDomain.stubs(:module_available? => nil)
    assert_equal false, CurrentDomain.module_enabled?(:foo_module), 'Expected module_enabled?(:foo) to return false'
  end

  def test_default_widget_customization_id_caches_and_returns_four_by_four
    four_by_four = '1234-1234'
    setup_default_widget_customization_preconditions(four_by_four)
    assert_equal four_by_four, CurrentDomain.default_widget_customization_id
    Configuration.stubs(:find_by_type).raises(RuntimeError)
    assert_equal four_by_four, CurrentDomain.default_widget_customization_id
  end

  def test_default_widget_customization_id_caches_and_returns_false
    setup_default_widget_customization_preconditions(nil)
    assert_equal false, CurrentDomain.default_widget_customization_id
    Configuration.stubs(:find_by_type).raises(RuntimeError)
    assert_equal false, CurrentDomain.default_widget_customization_id
  end

  def test_site_title_defaults_to_socrata_if_domain_not_set
    CurrentDomain.class_variable_set('@@current_domain', nil)
    assert_equal 'Socrata', CurrentDomain.site_title
  end

  def test_site_title_returns_proper_site_title_if_domain_is_set
    test_title = 'sproing'
    CurrentDomain.class_variable_set('@@current_domain',
      :modules => [{'name' => 'bar_module'}],
      :data => Hashie::Mash.new.tap { |data|
        data.feature = ['bar_module']
        data.stubs(:default_configuration => stub(:properties => stub(:strings! => stub(:site_title => test_title), :[] => nil)))
      }
    )
    assert_equal test_title, CurrentDomain.site_title
  end

  private

  def setup_default_widget_customization_preconditions(val)
    CurrentDomain.class_variable_set('@@current_domain', :widget_customization => nil)
    CurrentDomain.stubs(:cname => 'cname')
    configuration = OpenStruct.new(:properties => OpenStruct.new(:sdp_template => val))
    Configuration.stubs(:find_by_type => [configuration])
  end

end
