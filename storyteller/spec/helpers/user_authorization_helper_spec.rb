require 'rails_helper'

RSpec.describe UserAuthorizationHelper, type: :helper do
  let(:domain_rights) { [] }
  let(:view_role) { '' }
  let(:user_authorization) do
    {
      'viewRole' => view_role,
      'domainRights' => domain_rights
    }
  end
  let(:govstat_module_enabled) { false }

  before do
    allow(CoreServer).to receive(:current_user_story_authorization).and_return(user_authorization)
    set_features(govstat_module_enabled ? ['govstat'] : [])
    stub_current_domain
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

  describe '#has_any_domain_rights?' do
    describe 'when the user has any domain rights' do
      let(:domain_rights) { ['any_right'] }

      it 'returns true' do
        expect(has_any_domain_rights?).to be(true)
      end
    end

    describe 'when the user lacks domain rights' do
      let(:domain_rights) { [] }

      it 'returns false' do
        expect(has_any_domain_rights?).to be(false)
      end
    end
  end

  describe '#can_edit_story?' do
    describe 'when the user has the edit_others_stories right' do
      let(:domain_rights) { ['edit_others_stories'] }

      it 'returns true' do
        expect(can_edit_story?).to be(true)
      end
    end

    describe 'when the user is an owner and has a valid right' do
      let(:view_role) { 'owner' }
      let(:domain_rights) { ['edit_story'] }

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
      let(:domain_rights) { ['noting_above'] }

      it 'returns false' do
        expect(can_edit_story?).to be(false)
      end
    end
  end

  describe '#can_view_unpublished_story?' do
    describe 'when the user has the edit_others_stories right' do
      let(:domain_rights) { ['edit_others_stories'] }

      it 'returns true' do
        expect(can_view_unpublished_story?).to be(true)
      end
    end

    describe 'when the user is a contributor' do
      let(:view_role) { 'contributor' }

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

    describe 'when the user is an owner and has a valid right' do
      let(:view_role) { 'owner' }
      let(:domain_rights) { ['view_unpublished_story'] }

      it 'returns true' do
        expect(can_view_unpublished_story?).to be(true)
      end
    end

    describe 'when the user lacks a valid role or right' do
      let(:view_role) { 'not-editor-or-viewer' }

      it 'returns false' do
        expect(can_view_unpublished_story?).to be(false)
      end
    end
  end

  describe '#can_edit_title_and_description?' do
    describe 'when the user has the edit_others_stories right' do
      let(:domain_rights) { ['edit_others_stories'] }

      it 'returns true' do
        expect(can_edit_title_and_description?).to be(true)
      end
    end

    describe 'when the user is an owner and has a valid right' do
      let(:view_role) { 'owner' }
      let(:domain_rights) { ['edit_story_title_desc'] }

      it 'returns true' do
        expect(can_edit_title_and_description?).to be(true)
      end
    end

    describe 'when the user has a valid right and we are looking at a goal' do
      let(:domain_rights) { ['edit_story_title_desc'] }

      it 'returns true' do
        expect(can_edit_title_and_description?(is_goal = true)).to be(true)
      end
    end

    describe 'when the user is not an owner and does not have required rights' do
      let(:domain_rights) { ['not_stories_rights'] }
      let(:view_role) { 'not-owner' }

      it 'returns false' do
        expect(can_edit_title_and_description?).to be(false)
      end
    end
  end

  describe '#can_make_copy?' do
    describe 'when the user has the editr_others_stories right' do
      let(:domain_rights) { 'edit_others_stories' }

      it 'returns true' do
        expect(can_make_copy?).to be(true)
      end
    end

    describe 'when the user is an owner and has a valid right' do
      let(:view_role) { 'owner' }
      let(:domain_rights) { 'create_story_copy' }

      it 'returns true' do
        expect(can_make_copy?).to be(true)
      end
    end

    describe 'when the user has a valid right and we are looking at a goal' do
      let(:domain_rights) { ['create_story_copy'] }

      it 'returns true' do
        expect(can_make_copy?(is_goal = true)).to be(true)
      end
    end

    describe 'when the user is not an owner and does not have required rights' do
      let(:view_role) { 'not-owner' }

      it 'returns false' do
        expect(can_make_copy?).to be(false)
      end
    end
  end

  describe '#can_manage_collaborators?' do
    describe 'when the user has the edit_others_stories right' do
      let(:domain_rights) { ['edit_others_stories'] }

      it 'returns true' do
        expect(can_manage_collaborators?).to be(true)
      end
    end

    describe 'when the user is an owner and has a valid right' do
      let(:view_role) { 'owner' }
      let(:domain_rights) { ['manage_story_collaborators'] }

      it 'returns true' do
        expect(can_manage_collaborators?).to be(true)
      end
    end

    describe 'when the user is not an owner and does not have required rights' do
      let(:domain_rights) { ['not_stories_rights'] }
      let(:view_role) { 'not-owner' }

      it 'returns false' do
        expect(can_manage_collaborators?).to be(false)
      end
    end
  end

  describe '#can_manage_story_visibility?' do
    describe 'when the user has the edit_others_stories right' do
      let(:domain_rights) { ['edit_others_stories'] }

      it 'returns true' do
        expect(can_manage_story_visibility?).to be(true)
      end
    end

    describe 'when the user is an owner and has a valid right' do
      let(:view_role) { 'owner' }
      let(:domain_rights) { ['manage_story_visibility'] }

      it 'returns true' do
        expect(can_manage_story_visibility?).to be(true)
      end
    end

    describe 'when the user has a valid right and we are looking at a goal' do
      let(:domain_rights) { ['manage_story_visibility'] }

      it 'returns true' do
        expect(can_manage_story_visibility?(is_goal = true)).to be(true)
      end
    end

    describe 'when the user is not an owner and does not have required rights' do
      let(:domain_rights) { ['not_stories_rights'] }
      let(:view_role) { 'not-owner' }

      it 'returns false' do
        expect(can_manage_story_visibility?).to be(false)
      end
    end
  end

  describe '#can_publish_story?' do
    describe 'when the user has the edit_others_stories right' do
      let(:domain_rights) { ['edit_others_stories'] }

      it 'returns true' do
        expect(can_publish_story?).to be(true)
      end
    end

    describe 'when the user is an owner and has a valid right' do
      let(:view_role) { 'owner' }
      let(:domain_rights) { ['manage_story_public_version'] }

      it 'returns true' do
        expect(can_publish_story?).to be(true)
      end
    end

    describe 'when the user has a valid right and we are looking at a goal' do
      let(:domain_rights) { ['manage_story_public_version'] }

      it 'returns true' do
        expect(can_publish_story?(is_goal = true)).to be(true)
      end
    end

    describe 'when the user is not an owner and does not have required rights' do
      let(:domain_rights) { ['not_stories_rights'] }
      let(:view_role) { 'not-owner' }

      it 'returns false' do
        expect(can_publish_story?).to be(false)
      end
    end
  end

  describe '#can_see_story_stats?' do
    describe 'when the user has the edit_others_stories right' do
      let(:domain_rights) { ['edit_others_stories'] }

      it 'returns true' do
        expect(can_see_story_stats?).to be(true)
      end
    end

    describe 'when the user has the view_stories_stats right' do
      let(:view_role) { 'owner' }
      let(:domain_rights) { ['view_stories_stats'] }

      it 'returns true' do
        expect(can_see_story_stats?).to be(true)
      end
    end

    describe 'when the user is not an owner and does not have required rights' do
      let(:domain_rights) { ['not_stories_rights'] }
      let(:view_role) { 'not-owner' }

      it 'returns false' do
        expect(can_see_story_stats?).to be(false)
      end
    end
  end

  describe '#can_view_goal?' do
    let(:goal_uid) { 'asdf-fdsa' }
    let(:isAccessible) { false }

    shared_examples 'false if open performance disabled' do
      describe 'open performance is disabled' do
        let(:govstat_module_enabled) { false }

        it 'returns false' do
          expect(can_view_goal?('asdf-fdsa')).to be(false)
        end
      end
    end

    before do
      allow_any_instance_of(OpenPerformance::Goal).to(
        receive(:accessible?).and_return(isAccessible)
      )
    end

    describe 'open performance is enabled' do
      let(:govstat_module_enabled) { true }

      it 'passes argument to Goal.new' do
        expect(OpenPerformance::Goal).to receive(:new).with(goal_uid).and_call_original
        can_view_goal?('asdf-fdsa')
      end

      describe 'goal is not accessible' do
        let(:isAccessible) { false }

        it_behaves_like 'false if open performance disabled'

        it 'returns false' do
          expect(can_view_goal?('asdf-fdsa')).to be(isAccessible)
        end
      end

      describe 'goal is accessible' do
        let(:isAccessible) { true }

        it_behaves_like 'false if open performance disabled'

        it 'returns true' do
          expect(can_view_goal?('asdf-fdsa')).to be(isAccessible)
        end
      end
    end
  end

  describe '#goal_unauthorized?' do
    let(:goal_uid) { 'asdf-fdsa' }
    let(:unauthorized) { true }

    before do
      allow_any_instance_of(OpenPerformance::Goal).to(
        receive(:unauthorized?).and_return(unauthorized)
      )
    end

    it 'passes argument to Goal.new' do
      expect(OpenPerformance::Goal).to receive(:new).with(goal_uid).and_call_original
      goal_unauthorized?(goal_uid)
    end

    describe 'user not authorized' do
      let(:unauthorized) { true }
      it 'returns true' do
        expect(goal_unauthorized?(goal_uid)).to be(true)
      end
    end

    describe 'user authorized' do
      let(:unauthorized) { false }
      it 'returns false' do
        expect(goal_unauthorized?(goal_uid)).to be(false)
      end
    end
  end
end

