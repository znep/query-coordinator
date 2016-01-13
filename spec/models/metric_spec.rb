require 'rails_helper'

RSpec.describe Metric, type: :model do
  let(:entity_id) { 'hamw-ater' }
  let(:metric_name) { 'js-hot-ham-water' }

  let(:subject) { Metric.new(entity_id, metric_name) }

  it 'raises when initialized without parameters' do
    expect { Metric.new }.to raise_error(ArgumentError, /0 for \d..\d/)
  end

  it 'initializes with entity_id' do
    expect(subject.entity_id).to eq(entity_id)
  end

  it 'initializes with name' do
    expect(subject.name).to eq(metric_name)
  end

  it 'initializes with count by default' do
    expect(subject.count).to eq(1)
  end

  it 'can be initialized with a different count' do
    expect(
      Metric.new(entity_id, metric_name, 5).count
    ).to eq(5)
  end

  it 'initializes timestamp to now' do
    expect(subject.timestamp).to be_within(0.01).of(Time.now.to_i * 1000)
  end

  it 'initializes type to be "aggregate"' do
    expect(subject.type).to eq('aggregate')
  end

  describe '#to_hash' do
    let(:result) { subject.to_hash }

    it 'is a hash' do
      expect(result).to be_a(Hash)
    end

    it 'sets values from the object' do
      expect(result[:timestamp]).to be_within(1000).of(Time.now.to_i * 1000)
      expect(result[:entityId]).to eq(entity_id)
      expect(result[:name]).to eq(metric_name)
      expect(result[:value]).to eq(1)
      expect(result[:type]).to eq('aggregate')
    end
  end
end
