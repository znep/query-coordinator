require 'rails_helper'

RSpec.describe MetricsProcessor do

  let(:metrics) do
    [
      { timestamp: 1234, entityId: 'four-four', name: 'view-loaded', value: 1, type: 'aggregate' },
      { timestamp: 2345, entityId: 'four-four', name: 'view-loaded', value: 1, type: 'aggregate' }
    ]
  end

  describe '#process' do
    let(:metrics_path) { '/tmp/cheechaa' }

    before do
      allow(Rails.application.config).to receive(:metrics_path).and_return(metrics_path)
    end

    it 'raises when argument is not an array' do
      expect { MetricsProcessor.process('metrics') }.to raise_error(ArgumentError, 'arg[:metrics] must be an array')
    end

    it 'reads metrics path from config' do
      expect(FileUtils).to receive(:mkdir_p).with(metrics_path).and_call_original
      MetricsProcessor.process(metrics)
    end

    it 'writes metrics to file' do
      buffer = StringIO.new()
      filename = 'somefile.txt'
      allow(MetricsProcessor).to receive(:metrics_file_path).and_return(filename)
      allow(File).to receive(:open).with(filename, 'ab').and_yield(buffer)

      MetricsProcessor.process(metrics)

      expect(buffer.string).to eq('ÿ1234þfour-fourþview-loadedþ1þaggregateþÿ2345þfour-fourþview-loadedþ1þaggregateþ')
    end
  end
end
