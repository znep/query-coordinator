require 'rails_helper'
require 'json_with_airbrake'

describe JSONWithAirbrake do
  include TestHelperMethods

  before do
    # Note: Uninitialized, the CurrentDomain.cname method returns an empty string.
    init_current_domain
  end

  context 'without a request option' do

    it 'should rescue JSON::ParseErrors, notify Airbrake and re-raise' do
      expect(Airbrake).to receive(:notify)
      expect { JSONWithAirbrake.parse("\0xbad") }.to raise_error(JSON::ParserError)
    end

    context 'without a current user' do

      before do
        allow(User).to receive(:current_user).and_return(nil)
      end

      it 'should use "Anonymous" for the current user id' do
        expect(Airbrake).to receive(:notify).with(hash_including(
          :session => {
            :current_domain => 'localhost',
            :current_user_id => 'Anonymous'
          }
        ))
        expect { JSONWithAirbrake.parse("\0xbad") }.to raise_error(JSON::ParserError)
      end

    end

    context 'with a current user' do

      before do
        allow(User).to receive(:current_user).and_return(User.new('id' => 'ohmy-good'))
      end

      it 'should use include the user 4x4 in the parameters' do
        expect(Airbrake).to receive(:notify).with(hash_including(
          :session => {
            :current_domain => 'localhost',
            :current_user_id => 'ohmy-good'
          }
        ))
        expect { JSONWithAirbrake.parse("\0xbad") }.to raise_error(JSON::ParserError)
      end

    end
  end

  context 'with a request option' do

    let(:request) do
      double(ActionDispatch::Request).tap do |request|
        allow(request).to receive(:path).and_return('/catalog?foo=bar')
        allow(request).to receive(:method).and_return('GET')
        allow(request).to receive(:body).and_return('pillow')
      end
    end

    it 'should include the request in the parameters' do
      expect(Airbrake).to receive(:notify).with(hash_including(
        :parameters => {
          :request => {
            :path => '/catalog?foo=bar',
            :method => 'GET',
            :body => 'pillow'
          }
        }
      ))
      expect { JSONWithAirbrake.parse("\0xbad", :request => request) }.to raise_error(JSON::ParserError)
    end

  end

end
