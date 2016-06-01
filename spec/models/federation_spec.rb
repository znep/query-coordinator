require 'rails_helper'

describe Federation do
  include TestHelperMethods

  before(:each) do
    init_current_domain
    stub_request(:get, 'http://localhost:8080/federations.json')
      .with(request_headers).to_return(:status => 200, :body => federations_json_response, :headers => {})
  end

  it 'should consider only the first two federations to be valid' do
    # only the first two federations in the json response are "valid"
    expected = JSON.parse(federations_json_response).first(2).map do |hash|
      Federation.set_up_model(hash)
    end
    actual = Federation.federations
    expect(actual).to eq(expected)
  end

  it 'should boost federated search results' do
    expected = { 'performance.seattle.gov' => 0.8, 'data.seattle.gov' => 0.8 }
    actual = Federation.federated_search_boosts
    expect(actual).to eq(expected)
  end

  it 'should handle federating domain cnames with nil domain_id' do
    expected = ['localhost', 'performance.seattle.gov', 'data.seattle.gov']
    actual = Federation.federated_domain_cnames(nil)
    expect(actual).to eq(expected)
  end

  it 'should handle federating domain cnames with blank domain_id' do
    expected = ['localhost', 'performance.seattle.gov', 'data.seattle.gov']
    actual = Federation.federated_domain_cnames('')
    expect(actual).to eq(expected)
  end

  it 'should handle federating cnames with own domain_id' do
    expected = ['localhost']
    actual = Federation.federated_domain_cnames('1')
    expect(actual).to eq(expected)
  end

  it 'should handle federating cnames with federated domain_id' do
    expected = ['data.seattle.gov']
    actual = Federation.federated_domain_cnames('3')
    expect(actual).to eq(expected)
  end

  it 'should handle federating domain cnames with invalid federated domain_id' do
    actual = Federation.federated_domain_cnames('5')
    expect(actual).to be_empty
  end

  it 'should handle federating domain cnames with far out domain_id' do
    actual = Federation.federated_domain_cnames('123')
    expect(actual).to be_empty
  end

  # unit tests being a poor man's type system and all the rest of it
  it 'should handle federating domain cnames with strings or ints' do
    1.upto(6).each do |domain_id|
      expect(Federation.federated_domain_cnames(domain_id.to_s)).to eq(Federation.federated_domain_cnames(domain_id))
    end
  end

  private

  def federation_hash
    {
      'acceptedUserId' => 2,
      'acceptorScreenName' => 'Somebody Who',
      'lensName' => '',
      'providerScreenName' => 'Somebody Who',
      'searchBoost' => 0.8,
      'sourceDomainCName' => 'performance.seattle.gov',
      'sourceDomainId' => 3,
      'targetDomainCName' => 'localhost', # set by init_current_domain
      'targetDomainId' => 1,
      'flags' => []
    }
  end

  def federations_json_response
    [
      federation_hash.merge('sourceDomainId' => 2, 'sourceDomainCName' => 'performance.seattle.gov'),
      federation_hash.merge('sourceDomainId' => 3, 'sourceDomainCName' => 'data.seattle.gov'),
      federation_hash.merge('sourceDomainId' => 4, 'sourceDomainCName' => 'seattle.example.com', 'targetDomainId' => 11, 'targetDomainCName' => 'not-localhost'), # invalid
      federation_hash.merge('sourceDomainId' => 5, 'sourceDomainCName' => 'seattle.example.com', 'lensName' => "Lenz's law"), # invalid
      federation_hash.merge('sourceDomainId' => 6, 'sourceDomainCName' => 'seattle.example.com', 'acceptedUserId' => nil), # invalid
      federation_hash.merge('sourceDomainId' => 1, 'sourceDomainCName' => 'localhost', 'targetDomainCName' => 'localhost') # degenerate case
    ].to_json
  end

end
