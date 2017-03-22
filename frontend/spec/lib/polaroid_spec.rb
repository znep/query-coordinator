require 'rails_helper'

describe Polaroid do
  include TestHelperMethods

  let(:subject) { Polaroid.new }
  let(:connection_details) do
    {
      'address' => 'localhost',
      'port' => '1337'
    }.with_indifferent_access
  end

  before do
    init_current_domain
  end

  describe 'endpoint accessors' do
    it 'are initialized from connection details' do
      allow(subject).to receive(:connection_details).and_return(connection_details)

      expect(subject.address).to eq(connection_details[:address])
      expect(subject.port).to eq(connection_details[:port])
      expect(subject.end_point).to eq("http://#{connection_details[:address]}:#{connection_details[:port]}")
    end

    it 'will raise if no address is given' do
      invalid_connection_details = { 'address' => nil }.with_indifferent_access
      allow(subject).to receive(:connection_details).and_return(invalid_connection_details)

      expect { subject.end_point }.to raise_error(SocrataHttp::ConfigurationError)
    end
  end

  describe '#fetch_image' do
    before do
      allow(subject).to receive(:connection_details).and_return(connection_details)
    end

    it 'forwards the response when Polaroid generates an image' do
      mock_response = instance_double(Net::HTTPSuccess)
      allow(mock_response).to receive(:to_hash).and_return({})
      allow(mock_response).to receive(:kind_of?).and_return(false)
      allow(mock_response).to receive(:kind_of?).with(Net::HTTPSuccess).and_return(true)
      allow(mock_response).to receive(:code).and_return(200)
      allow(mock_response).to receive(:body).and_return('valid image!')
      allow(mock_response).to receive(:content_type).and_return('image/png')
      allow(Net::HTTP).to receive(:start).and_return(mock_response)

      expect(subject.fetch_image({}, {})).to eq({
        'status' => '200',
        'body' => 'valid image!',
        'content_type' => 'image/png'
      })
    end

    it 'creates a well-formed error response when Polaroid encounters an error' do
      mock_response = instance_double(Net::HTTPServerError)
      allow(mock_response).to receive(:to_hash).and_return({})
      allow(mock_response).to receive(:kind_of?).and_return(false)
      allow(mock_response).to receive(:code).and_return(500)
      allow(mock_response).to receive(:body).and_return('<h1>ERROR</h1>')
      allow(mock_response).to receive(:content_type).and_return('text/html')
      allow(Net::HTTP).to receive(:start).and_return(mock_response)

      expect(subject.fetch_image({}, {})).to eq({
        'status' => '500',
        'body' => {
          'error' => true,
          'reason' => 'Received error status and unexpected return type from image service',
          'details' => {
            'content_type' => 'text/html'
          }
        },
        'content_type' => 'application/json'
      })
    end

    it 'raises when Polaroid times out' do
      allow(Net::HTTP).to receive(:start).and_raise(Timeout::Error)

      expect { subject.fetch_image({}, {}) }.to raise_error(SocrataHttp::ConnectionError)
    end
  end
end
