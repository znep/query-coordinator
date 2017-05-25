require 'rails_helper'

describe ViewsHelper do
  include TestHelperMethods

  let(:display_type) { 'dataset' }
  let(:description) { 'Some description' }
  let(:tags) { %w( financial ) }
  let(:updated_at) { nil }

  let(:the_view) do
    View.new({
      'displayType' => display_type,
      'description' => description,
      'tags' => tags,
      'rowsUpdatedAt' => updated_at
    })
  end

  before do
    init_current_domain
    allow(helper).to receive(:view).and_return(the_view)
  end

  describe '#view_meta_description' do

    it 'returns description' do
      expect(helper.view_meta_description).to eq(description)
    end

    context 'when view description is blank' do
      let(:description) { nil }

      it 'returns default message' do
        expect(helper.view_meta_description).to eq('View this dataset')
      end

      context 'when viewtype is story' do
        let(:display_type) { 'story' }

        it 'returns default message' do
          expect(helper.view_meta_description).to eq('View this story')
        end
      end

      context 'when update_at is present' do
        let(:updated_at) { Time.parse('2017-05-21').to_i }

        it 'includes updated at in output' do
          expect(helper.view_meta_description).to eq('View this dataset, last updated May 21 2017')
        end
      end
    end

    context 'when view is missing' do
      let(:the_view) { nil }

      it 'returns nil' do
        expect(helper.view_meta_description).to be_nil
      end
    end
  end

  describe '#view_meta_keywords' do

    it 'returns view tags and default tags' do
      expect(helper.view_meta_keywords).to eq(tags + ViewsHelper::DEFAULT_META_KEYWORDS)
    end

    context 'when view tags is blank' do
      let(:tags) { nil }

      it 'returns default keywords' do
        expect(helper.view_meta_keywords).to eq(ViewsHelper::DEFAULT_META_KEYWORDS)
      end
    end

    context 'when view is missing' do
      let(:the_view) { nil }

      it 'returns nil' do
        expect(helper.view_meta_keywords).to be_nil
      end
    end
  end

end
