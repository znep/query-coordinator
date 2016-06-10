require 'rails_helper'

describe SocrataRecaptcha do
  let (:recaptcha_url) { 'https://www.google.com/recaptcha/api/siteverify' }
  let (:response_token) { 'test-response-token' }
  let (:recaptcha_params) do
    {
      :secret => RECAPTCHA_2_SECRET_TOKEN,
      :response => response_token
    }.to_json
  end

  it 'returns false when missing a response token' do
    expect(SocrataRecaptcha.valid(nil)).to eq(false)
    expect(SocrataRecaptcha.valid('')).to eq(false)
  end

  it 'returns false when the Recaptcha validation request fails' do
    stub_request(:post, recaptcha_url).
      with(:body => 'secret=&response=test-response-token').
      to_return(:status => 500)

    expect(SocrataRecaptcha.valid(response_token)).to eq(false)
  end

  it 'returns false when Recaptcha is invalid' do
    stub_request(:post, recaptcha_url).
      with(:body => 'secret=&response=test-response-token').
      to_return(
        :status => 200,
        :headers => {'Content-Type' => 'application/json'},
        :body => {
          'success' => false,
          'hostname' => 'elephants-in-space.com',
          'error-codes' => ['invalid-input-response']
        }.to_json
      )

    expect(SocrataRecaptcha.valid(response_token)).to eq(false)
  end

  it 'returns false when the requesting domain is not the current domain' do
    allow(CurrentDomain).to receive(:cname) { 'wombats-in-tuxedos.com' }
    stub_request(:post, recaptcha_url).
      with(:body => 'secret=&response=test-response-token').
      to_return(
        :status => 200,
        :headers => {'Content-Type' => 'application/json'},
        :body => {
          'success' => true,
          'hostname' => 'elephants-in-space.com'
        }.to_json
      )

    expect(SocrataRecaptcha.valid(response_token)).to eq(false)
  end

  it 'returns true when Recaptcha is valid and domain verification succeeds' do
    allow(CurrentDomain).to receive(:cname) { 'elephants-in-space.com' }
    stub_request(:post, recaptcha_url).
      with(:body => 'secret=&response=test-response-token').
      to_return(
        :status => 200,
        :headers => {'Content-Type' => 'application/json'},
        :body => {
          'success' => true,
          'hostname' => 'elephants-in-space.com'
        }.to_json
      )

    expect(SocrataRecaptcha.valid(response_token)).to eq(true)
  end
end
