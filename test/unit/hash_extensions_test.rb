require_relative '../test_helper'

class HashExtensionsTest < Test::Unit::TestCase

  describe 'deep_string_strip!' do
    it 'should strip whitespace on any strings in self' do
      hash_under_test = {
        :noop_expected => 'all happy',
        :whitespace_before => '  foo',
        :whitespace_after => "foo \t",
        :whitespace_both => "\t foo\n"
      }

      expected = {
        :noop_expected => 'all happy',
        :whitespace_before => 'foo',
        :whitespace_after => 'foo',
        :whitespace_both => 'foo'
      }

      hash_under_test.deep_string_strip!

      assert_equal expected, hash_under_test
    end

    it 'should strip whitespace on any strings in children' do
      hash_under_test = {
        :child => {
          :value => ' foo '
        }
      }

      expected = {
        :child => {
          :value => 'foo'
        }
      }

      hash_under_test.deep_string_strip!

      assert_equal expected, hash_under_test
    end

    it 'should leave non-strings alone' do
      hash_under_test = {
        :number => 12,
        :true => true,
        :false => false,
        :nil => nil
      }

      expected = {
        :number => 12,
        :true => true,
        :false => false,
        :nil => nil
      }

      hash_under_test.deep_string_strip!

      assert_equal expected, hash_under_test
    end
  end

end
