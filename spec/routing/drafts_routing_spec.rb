require 'rails_helper'

RSpec.describe 'drafts routing', type: :routing do

  describe 'create endpoint' do

    it 'routes json requests to DraftsController' do
      expect(post: '/s/four-four/drafts', format: 'json').to route_to(
        controller: 'drafts',
        action: 'create',
        uid: 'four-four',
        format: 'json'
      )
    end

    it 'routes to DraftsController with json by default' do
      expect(post: '/s/four-four/drafts').to route_to(
        controller: 'drafts',
        action: 'create',
        uid: 'four-four',
        format: 'json'
      )
    end
  end
end
