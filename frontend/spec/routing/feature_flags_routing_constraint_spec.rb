require 'rails_helper'
require 'feature_flags/routing_constraint'

class ConstraintWithInitialize
  include FeatureFlags::RoutingConstraintMixin
  test_feature_flags!(routing_flag: true)

  def initialize
    @initialized = true
  end

  def matches?(request)
    @initialized && passes_feature_flag_test?(request)
  end
end

class ConstraintWithoutInitialize
  include FeatureFlags::RoutingConstraintMixin
  test_feature_flags!(routing_flag: true)

  def matches?(request)
    passes_feature_flag_test?(request)
  end
end

shared_examples 'feature flag routing constraint' do
  include TestHelperMethods

  before(:each) do
    init_current_domain
    init_feature_flag_signaller(with: { routing_flag: flag_value })
  end
  let(:mock_request) { double(:request, query_parameters: {}) }

  context 'when the feature flag passes' do
    let(:flag_value) { true }

    it 'should match' do
      expect(subject.matches?(mock_request)).to eq(true)
    end
  end

  context 'when the feature flag does not pass' do
    let(:flag_value) { false }

    it 'should not match' do
      expect(subject.matches?(mock_request)).to eq(false)
    end
  end
end

describe FeatureFlags::RoutingConstraintMixin do
  context 'when the constraint has initialize' do
    subject { ConstraintWithInitialize.new }
    it_behaves_like 'feature flag routing constraint'
  end

  context 'when the constraint does not have initialize' do
    subject { ConstraintWithoutInitialize.new }
    it_behaves_like 'feature flag routing constraint'
  end

  describe '#passes_feature_flag_test?' do
    subject { FeatureFlags::RoutingConstraint.new(:routing_flag, constraint_value) }
    before(:each) do
      allow(FeatureFlags).to receive(:value_for).and_return(flag_value)
    end

    context 'when the constraint specifies some exact value' do
      let(:constraint_value) { 'i am very exact' }

      context 'and receives it' do
        let(:flag_value) { 'i am very exact' }

        it 'should pass' do
          expect(subject.passes_feature_flag_test?(nil)).to eq(true)
        end
      end

      context 'and does not receive it' do
        let(:flag_value) { 'nope' }

        it 'should not pass' do
          expect(subject.passes_feature_flag_test?(nil)).to eq(false)
        end
      end
    end

    context 'when the constraint specifies nil' do
      let(:constraint_value) { nil }

      context 'and receives something truthy' do
        let(:flag_value) { 'i am true' }

        it 'should pass' do
          expect(subject.passes_feature_flag_test?(nil)).to eq(true)
        end
      end

      context 'and receives something falsey' do
        let(:flag_value) { nil }

        it 'should not pass' do
          expect(subject.passes_feature_flag_test?(nil)).to eq(false)
        end
      end
    end

    context 'when the constraint specifies a proc' do
      let(:constraint_value) { :!.to_proc }

      context 'and receives something that returns true' do
        let(:flag_value) { false }

        it 'should pass' do
          expect(subject.passes_feature_flag_test?(nil)).to eq(true)
        end
      end

      context 'and receives something that returns false' do
        let(:flag_value) { true }

        it 'should not pass' do
          expect(subject.passes_feature_flag_test?(nil)).to eq(false)
        end
      end
    end

    context 'when the constraint specifies an array' do
      let(:constraint_value) { %w( yes we can ) }

      context 'and receives something in the array' do
        let(:flag_value) { 'we' }

        it 'should pass' do
          expect(subject.passes_feature_flag_test?(nil)).to eq(true)
        end
      end

      context 'and receives something that is not in the array' do
        let(:flag_value) { 'sigh' }

        it 'should not pass' do
          expect(subject.passes_feature_flag_test?(nil)).to eq(false)
        end
      end
    end
  end
end

describe FeatureFlags::RoutingConstraint do
  subject { FeatureFlags::RoutingConstraint.new(:routing_flag) }
  it_behaves_like 'feature flag routing constraint'
end
