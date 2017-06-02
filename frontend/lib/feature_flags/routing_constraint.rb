require 'feature_flags'

class FeatureFlags
  module RoutingConstraintMixin

    # This is a trick for cases where the constraint has its own #initialize method.
    # We prepend this so that calling `super` will call the original #initialize method.
    #
    # We do this so that #feature_flags can be used as a class method.
    module Initializer
      def initialize(*args)
        test_feature_flags!(self.class.instance_variable_get(:@flags).to_h)
        super(*args)
      end
    end

    def self.included(other)
      other.extend(self)
      other.prepend(Initializer)
    end

    # This can be used as a class method or an instance method.
    # Cumulatively add to the list of feature flags we care about testing.
    #
    # Usage:
    # some_feature_flag: true => Route matches iff value is `true`.
    # some_feature_flag: nil => Route matches iff value is any kind of truthy.
    # some_feature_flag: -> { rand(5) > 2 } => Route matches iff the Proc returns true.
    # some_feature_flag: [ 1, 3, 4 ] => Route matches iff value is one of array values.
    def test_feature_flags!(**flags)
      @flags ||= {}
      @flags.merge!(flags)
    end

    # This is intended to be called by Constraint#matches?
    def passes_feature_flag_test?(request)
      @flags.all? do |(flag, test)|
        value = FeatureFlags.value_for(flag, request: request)
        case test
          when Array then test.include?(value)
          when Proc then test.call(value)
          when NilClass then value
          else value == test
        end
      end
    end
  end

  # This is a helper class for using the mixin in the simplest possible way.
  class RoutingConstraint
    include RoutingConstraintMixin

    def initialize(feature_flag, desired_value = true)
      test_feature_flags!(feature_flag => desired_value)
    end

    def matches?(request)
      passes_feature_flag_test?(request)
    end
  end
end
