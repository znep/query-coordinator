require 'rails_helper'

RSpec.describe ProfileHelper, type: :helper do

  describe '#view_url_pulse' do
    let(:view) { double('view', id: 'four-four', pulse?: view_is_pulse, story?: false) }
    let(:view_is_pulse) { true }

    describe 'when encountering a Pulse view' do
      it 'Returns a Pulse url' do
        expect(view_url(view)).to eq('/pulse/view/four-four')
      end
    end
  end

  describe '#view_url' do
    let(:rights) { [] }
    let(:current_user_id) { 'four-four' }
    let(:current_user) { User.new('id' => current_user_id, 'rights' => rights) }
    let(:grants) { [] }
    let(:owner_id) { 'rawr-rawr' }
    let(:owner) { Owner.new('id' => owner_id) }
    let(:view) { double('view', id: 'four-four', story?: view_is_story, grants: grants, owner: owner) }
    let(:view_is_story) { true }
    let(:viewing_self) { true }

    before do
      allow_any_instance_of(ProfileHelper).to receive(:viewing_self?).and_return(viewing_self)
      allow_any_instance_of(UserAuthMethods).to receive(:current_user).and_return(current_user)
    end

    describe 'when encountering a story view' do
      describe 'when the user has contributor access' do
        let(:grants) {
          [ Grant.new('userId' => current_user_id, 'type' => 'contributor') ]
        }

        it 'returns a url with /edit at the end' do
          expect(view_url(view)).to eq('/stories/s/four-four/edit')
        end
      end

      describe 'when the user has owner access' do
        let(:grants) {
          [ Grant.new('userId' => current_user_id, 'type' => 'owner') ]
        }

        it 'returns a url with /edit at the end' do
          expect(view_url(view)).to eq('/stories/s/four-four/edit')
        end
      end

      describe 'when the user has viewer access' do
        let(:grants) {
          [ Grant.new('userId' => current_user_id, 'type' => 'viewer') ]
        }

        it 'returns a url with /preview at the end' do
          expect(view_url(view)).to eq('/stories/s/four-four/preview')
        end
      end

      describe 'when the user is an admin' do
        before do
          allow_any_instance_of(User).to receive(:is_admin?).and_return(true)
        end

        it 'returns a url with /edit at the end' do
          expect(view_url(view)).to eq('/stories/s/four-four/edit')
        end
      end

      describe 'when the user owns the view' do
        let(:owner_id) { current_user_id }

        it 'returns a url with /edit at the end' do
          expect(view_url(view)).to eq('/stories/s/four-four/edit')
        end
      end

      describe 'when the user has no access' do
        it 'returns a url with nothing at the end' do
          expect(view_url(view)).to eq('/stories/s/four-four')
        end
      end
    end
  end
end
