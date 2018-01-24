require 'rails_helper'

describe Cetera::Results do
  include TestHelperMethods
  describe 'TagCountResult' do
    let(:cetera_results) do
      Cetera::Results::TagCountResult.new(json_fixture('cetera_domain_tag_results.json'))
    end

    it 'returns a TagCountResult object' do
      expect(cetera_results.class).to eq(Cetera::Results::TagCountResult)
    end

    it 'returns a results object that is an array of Tag objects' do
      expect(cetera_results.results.class).to eq(Array)
      expect(cetera_results.results[0].class).to eq(Tag)
    end

    it 'returns Tag objects that have expected properties' do
      expect(cetera_results.results[0].name).to eq('desire')
      expect(cetera_results.results[0].domain_tag).to eq('desire')
      expect(cetera_results.results[0].frequency).to eq(3)
      expect(cetera_results.results[0].count).to eq(3)
    end
  end
end
