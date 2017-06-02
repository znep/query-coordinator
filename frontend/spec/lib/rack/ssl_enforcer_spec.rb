require 'rails_helper'

describe Rack::SslEnforcer do

  let(:subject) { Rack::SslEnforcer.new('app') }

  it 'returns 400 status when triggered' do
    allow(subject).to receive(:redirect_required?).and_return(true)
    allow(subject).to receive(:ignore?).and_return(false)
    allow(subject).to receive(:enforce_ssl?).and_return(true)

    expect(subject).to receive(:modify_location_and_redirect).and_raise(URI::InvalidURIError)
    expect(subject.call({})).to eq([400, { 'Content-Type' => 'text/html' }, [Rack::SslEnforcer::INVALID_URI_ERROR_MESSAGE]])
  end

end
