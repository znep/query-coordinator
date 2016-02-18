require 'rails_helper'

RSpec.describe InspirationCategoryList, type: :model do
  let(:current_user) { {
    'displayName' => 'mock user display name',
    'email' => 'mock@email.com'
  } }
  let(:base_asset_path) { '/basepath/' }
  let(:inspiration_category_list) { InspirationCategoryList.new(current_user, base_asset_path) }

  describe '#to_json' do
    let(:to_json) { inspiration_category_list.to_json }

    it 'returns parsable json' do
      expect do
        JSON.parse(to_json)
      end.to_not raise_error
    end

    it 'returns json containing the categorized keys' do
      expect(JSON.parse(to_json)).to have_key('text')
      expect(JSON.parse(to_json)).to have_key('media_and_text')
      expect(JSON.parse(to_json)).to have_key('dividers_and_spacers')
    end

    describe 'author block' do
      let(:parsed) { JSON.parse(to_json) }
      let(:author_value) do
        author_block = parsed['hero']['blocks'].find do |block|
          block['blockContent']['components'][0]['type'] === 'author'
        end
        author_block['blockContent']['components'][0]['value']
      end

      it 'returns the author block with the current user\'s name' do
        expect(author_value['blurb']).to include('mock user display name')
      end

      describe 'with no profile image' do
        it 'returns the author block with a placeholder image' do
          expect(author_value['image']['url']).to include('/assets/large-profile')
        end
      end

      describe 'with a profile image' do
        let(:current_user) { {
          'displayName' => 'mock user display name',
          'email' => 'mock@email.com',
          'profileImageUrlLarge' => '/some/image.png'
        } }

        it 'returns the author block with the profile image' do
          expect(author_value['image']['url']).to eq('/some/image.png')
        end
      end
    end

  end

  describe '#blocks' do
    it 'returns an array with the "blockContent" key' do
      expect(inspiration_category_list.blocks[0]).to have_key('blockContent')
    end

  end

end
