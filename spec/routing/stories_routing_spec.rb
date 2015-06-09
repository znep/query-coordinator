require 'rails_helper'

RSpec.describe 'stories routing', type: :routing do
  let(:four_by_four) { '52my-2pac' }
  let(:vanity_text) { 'let_me_tell-you-a-story' }

  # NOTE: Should be /stories/s/#{vanity_text}/#{four_by_four},
  # but RSpec routing tests seem to ignore relative_url_root.
  let(:stories_vanity_show_route_url) { "/s/#{vanity_text}/#{four_by_four}" }
  let(:stories_vanity_edit_route_url) { "/s/#{vanity_text}/#{four_by_four}/edit" }
  let(:stories_show_route_url) { "/s/#{four_by_four}" }
  let(:stories_edit_route_url) { "/s/#{four_by_four}/edit" }

  describe 'stories show and edit routes' do

    context 'with vanity text' do

      it 'routes to show' do
        expect(get: stories_vanity_show_route_url).to route_to(
          controller: 'stories',
          action: 'show',
          four_by_four: four_by_four,
          vanity_text: vanity_text
        )
      end

      it 'routes to edit' do
        expect(get: stories_vanity_edit_route_url).to route_to(
          controller: 'stories',
          action: 'edit',
          four_by_four: four_by_four,
          vanity_text: vanity_text
        )
      end

      context 'when vanity text contains strange characters' do
        let(:vanity_text) { 'A+a!B_79~()+abd' }
        let(:four_by_four) { '1234-0987' }

        it 'routes to show' do
          expect(get: stories_vanity_show_route_url).to route_to(
            controller: 'stories',
            action: 'show',
            four_by_four: four_by_four,
            vanity_text: vanity_text
          )
        end

        it 'routes to edit' do
          expect(get: stories_vanity_edit_route_url).to route_to(
            controller: 'stories',
            action: 'edit',
            four_by_four: four_by_four,
            vanity_text: vanity_text
          )
        end
      end

      context 'when the 4x4 is too long' do
        let(:four_by_four) { 'not-afourbyfour' }

        it 'does not route to show' do
          expect(get: stories_vanity_show_route_url).to_not be_routable
        end

        it 'does not route to edit' do
          expect(get: stories_vanity_edit_route_url).to_not be_routable
        end
      end

      context 'when the 4x4 has no dash' do
        let(:four_by_four) { 'nota_4x4x' }

        it 'does not route to show' do
          expect(get: stories_vanity_show_route_url).to_not be_routable
        end

        it 'does not route to edit' do
          expect(get: stories_vanity_edit_route_url).to_not be_routable
        end
      end
    end # end with vanity text tests


    context 'without vanity text' do

      it 'routes to show' do
        expect(get: stories_show_route_url).to route_to(
          controller: 'stories',
          action: 'show',
          four_by_four: four_by_four
        )
      end

      it 'routes to edit' do
        expect(get: stories_edit_route_url).to route_to(
          controller: 'stories',
          action: 'edit',
          four_by_four: four_by_four
        )
      end

      context 'with an invalid 4x4' do
        let(:four_by_four) { 'really_im_not_a_fourbyfour' }

        it 'does not route to show' do
          expect(get: stories_show_route_url).to_not be_routable
        end

        it 'does not route to edit' do
          expect(get: stories_edit_route_url).to_not be_routable
        end
      end

    end # end without vanity text tests

  end # end show and edit routes

end
