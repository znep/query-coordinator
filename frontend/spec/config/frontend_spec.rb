require 'rails_helper'

describe Frontend do

  describe '#version' do

    it 'responds with a semver string' do
      expect(Frontend.version).to match(/^\d+\.\d+\.\d+$/)
    end

  end

end
