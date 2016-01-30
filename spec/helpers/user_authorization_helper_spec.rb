require 'rails_helper'

RSpec.describe UserAuthorizationHelper, type: :helper do
  let(:domain_rights) { [] }
  let(:domain_role) { '' }
  let(:view_role) { '' }
  let(:user_authorization) {
    {
      'viewRole' => view_role,
      'domainRole' => domain_role,
      'domainRights' => domain_rights
    }
  }

  before do
    allow(CoreServer).to receive(:current_user_story_authorization).and_return(user_authorization)
  end

  describe '#contributor?' do
    describe 'when the user is not a contributor' do
      let(:view_role) { 'not-contributor' }

      it 'returns false' do
        expect(contributor?).to be(false)
      end
    end

    describe 'when the user is a contributor' do
      let(:view_role) { 'contributor' }

      it 'returns true' do
        expect(contributor?).to be(true)
      end
    end
  end

  describe '#viewer?' do
    describe 'when the user is not a viewer' do
      let(:view_role) { 'not-viewer' }

      it 'returns false' do
        expect(viewer?).to be(false)
      end
    end

    describe 'when the user is a viewer' do
      let(:view_role) { 'viewer' }

      it 'returns true' do
        expect(viewer?).to be(true)
      end
    end
  end

  describe '#owner?' do
    describe 'when the user is not a owner' do
      let(:view_role) { 'not-owner' }

      it 'returns false' do
        expect(owner?).to be(false)
      end
    end

    describe 'when the user is a owner' do
      let(:view_role) { 'owner' }

      it 'returns true' do
        expect(owner?).to be(true)
      end
    end
  end

  describe '#admin?' do
    describe 'when the user is an administrator' do
      let(:domain_role) { 'administrator' }

      it 'returns true' do
        expect(admin?).to be(true)
      end
    end

    describe 'when the user is not an administrator' do
      let(:domain_rights) { ['edit_story'] }

      describe 'when the user is a super admin' do
        let(:domain_role) { 'unknown' }

        it 'returns true' do
          expect(admin?).to be(true)
        end
      end

      describe 'when the user is not a super admin' do
        let(:domain_role) { 'not-administrator-or-unknown' }

        it 'returns false' do
          expect(admin?).to be(false)
        end
      end
    end
  end

  describe '#storyteller_role?' do
    describe 'when the user does not have a Stories role' do
      let(:domain_role) { 'not-a-stories-role' }

      it 'returns false' do
        expect(storyteller_role?).to be(false)
      end
    end

    describe 'when the user does have a Stories role' do
      describe 'when that role is publisher_stories' do
        let(:domain_role) { 'publisher_stories' }

        it 'returns true' do
          expect(storyteller_role?).to be(true)
        end
      end

      describe 'when that role is editor_stories' do
        let(:domain_role) { 'editor_stories' }

        it 'returns true' do
          expect(storyteller_role?).to be(true)
        end
      end
    end
  end

  describe '#can_edit_story?' do
    describe 'when the user is an admin' do
      let(:domain_role) { 'administrator' }

      it 'returns true' do
        expect(can_edit_story?).to be(true)
      end
    end

    describe 'when the user is an owner and in a Stories role' do
      let(:view_role) { 'owner' }
      let(:domain_role) { 'publisher_stories' }

      it 'returns true' do
        expect(can_edit_story?).to be(true)
      end
    end

    describe 'when the user is a contributor' do
      let(:view_role) { 'contributor' }

      it 'returns true' do
        expect(can_edit_story?).to be(true)
      end
    end

    describe 'when the user is not any of the above' do
      let(:view_role) { 'nothing-above' }
      let(:domain_role) { 'nothing-above' }

      it 'returns false' do
        expect(can_edit_story?).to be(false)
      end
    end
  end

  describe '#can_view_unpublished_story?' do
    describe 'when the user can edit the story' do
      before do
        allow_any_instance_of(UserAuthorizationHelper).to receive(:can_edit_story?).and_return(true)
      end

      it 'returns true' do
        expect(can_view_unpublished_story?).to be(true)
      end
    end

    describe 'when the user is a viewer' do
      let(:view_role) { 'viewer' }

      it 'returns true' do
        expect(can_view_unpublished_story?).to be(true)
      end
    end

    describe 'when the user is neither an editor nor a viewer' do
      let(:view_role) { 'not-editor-or-viewer' }

      before do
        allow_any_instance_of(UserAuthorizationHelper).to receive(:can_edit_story?).and_return(false)
      end

      it 'returns false' do
        expect(can_view_unpublished_story?).to be(false)
      end
    end
  end

  describe '#can_make_copy?' do
    describe 'when the user is an admin' do
      let(:domain_role) { 'administrator' }

      it 'returns true' do
        expect(can_make_copy?).to be(true)
      end
    end

    describe 'when the user is an owner and in a Stories role' do
      let(:view_role) { 'owner' }
      let(:domain_role) { 'publisher_stories' }

      it 'returns true' do
        expect(can_make_copy?).to be(true)
      end
    end

    describe 'when the user is neither an admin nor an owner with a Stories role' do
      let(:domain_role) { 'not-administator-nor-publisher_stories' }
      let(:view_role) { 'not-owner' }

      it 'returns false' do
        expect(can_make_copy?).to be(false)
      end
    end
  end
end

