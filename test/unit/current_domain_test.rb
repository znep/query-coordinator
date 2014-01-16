require 'test_helper'

# Uncomment the three lines below to run this test in isolation of Rails via command:
#   ruby test/unit/current_domain_test.rb
# require 'minitest/autorun'
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

end
