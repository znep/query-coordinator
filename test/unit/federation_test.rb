require 'test_helper'

class FederationTest < Test::Unit::TestCase
  describe 'federated search boosts' do
    def federation_hash
      {
        'id' => 2,
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
        federation_hash.merge('id' => 2, 'sourceDomainCName' => 'performance.seattle.gov'),
        federation_hash.merge('id' => 3, 'sourceDomainCName' => 'data.seattle.gov'),
        federation_hash.merge('id' => 4, 'sourceDomainCName' => 'seattle.example.com',
                              'targetDomainCName' => 'not-localhost'), # invalid
        federation_hash.merge('id' => 5, 'sourceDomainCName' => 'seattle.example.com',
                              'lensName' => "Lenz's law"), # invalid
        federation_hash.merge('id' => 6, 'sourceDomainCName' => 'seattle.example.com',
                              'acceptedUserId' => nil), # invalid
        federation_hash.merge('id' => 1, 'sourceDomainCName' => 'localhost',
                              'targetDomainCName' => 'localhost') # degenerate case
      ].to_json
    end

    def setup
      init_current_domain
      stub_request(:get, "http://localhost:8080/federations.json")
        .with(:headers => {'Accept'=>'*/*', 'User-Agent'=>'Ruby', 'X-Socrata-Host'=>'localhost'})
        .to_return(:status => 200, :body => federations_json_response, :headers => {})
    end

    def test_federations
      # only the first two federations in the json response are "valid"
      expected = JSON.parse(federations_json_response).first(2).map do |hash|
        Federation.set_up_model(hash)
      end
      actual = Federation.federations
      assert_equal expected, actual
    end

    def test_federated_search_boosts
      expected = { 'performance.seattle.gov' => 0.8, 'data.seattle.gov' => 0.8 }
      actual = Federation.federated_search_boosts
      assert_equal expected, actual
    end

    def test_federated_domain_cnames_with_nil_domain_id
      expected = ['localhost', 'performance.seattle.gov', 'data.seattle.gov']
      actual = Federation.federated_domain_cnames(nil)
      assert_equal expected, actual
    end

    def test_federated_domain_cnames_with_blank_domain_id
      expected = ['localhost', 'performance.seattle.gov', 'data.seattle.gov']
      actual = Federation.federated_domain_cnames('')
      assert_equal expected, actual
    end

    def test_federated_domain_cnames_with_own_domain_id
      Federation.unstub(:find) # no need to call out to federations
      expected = ['localhost']
      actual = Federation.federated_domain_cnames('1')
      assert_equal expected, actual
    end

    def test_federated_domain_cnames_with_federated_domain_id
      expected = ['data.seattle.gov']
      actual = Federation.federated_domain_cnames('3')
      assert_equal expected, actual
    end

    def test_federated_domain_cnames_with_invalid_federated_domain_id
      actual = Federation.federated_domain_cnames('5')
      assert_empty actual
    end

    def test_federated_domain_cnames_with_far_out_domain_id
      actual = Federation.federated_domain_cnames('123')
      assert_empty actual
    end

    # unit tests being a poor man's type system and all the rest of it
    def test_federated_domain_cnames_can_deal_with_strings_or_ints
      1.upto(6).each do |domain_id|
        assert_equal(
          Federation.federated_domain_cnames(domain_id),
          Federation.federated_domain_cnames(domain_id.to_s)
        )
      end
    end
  end
end
