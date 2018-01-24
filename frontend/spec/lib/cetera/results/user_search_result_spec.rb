require 'rails_helper'

describe Cetera::Results do
  include TestHelperMethods
  describe 'UserSearchResult' do
    let(:user_results) do
      Cetera::Results::UserSearchResult.new(json_fixture('cetera_two_user_results.json'))
    end

    it 'returns a UserSearchResult object' do
      expect(user_results.class).to eq(Cetera::Results::UserSearchResult)
    end

    it 'returns a results object that is an array of User objects' do
      expect(user_results.results.class).to eq(Array)
      expect(user_results.results[0].class).to eq(User)
    end

    it 'returns User objects with keys properly remapped' do
      user_data = user_results.results[0].data
      # snake_case keys should be missing
      expect(user_data).to_not have_key('display_name')
      expect(user_data).to_not have_key('role_name')

      # camel case and single word keys should be present
      expect(user_data['id']).to eq('funs-bear')
      expect(user_data['displayName']).to eq('Funshine Bear')
      expect(user_data['email']).to eq('funshine.bear@care.alot')
      expect(user_data['roleName']).to eq('bear')
    end

    it 'returns a single dash for the displayName if no screen_name is present' do
      user_data = user_results.results[1].data
      expect(user_data['displayName']).to eq('-')
    end
  end
end
