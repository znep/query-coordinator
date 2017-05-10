require 'rails_helper'

describe 'themes routing', type: :routing do

  describe 'themes/custom' do
    it 'routes to #custom with default formatting of css' do
      expect(get: 'themes/custom').to route_to(
        controller: 'themes',
        action: 'custom',
        format: 'css'
      )
    end
  end

end
