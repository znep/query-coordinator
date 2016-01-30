require 'rails_helper'

RSpec.describe PermissionsUpdater do

  let(:user) { mock_valid_user }
  let(:user_authorization) { mock_user_authorization }
  let(:story_uid) { 'abcd-efgh' }
  let(:core_view_response) do
    {
      'id' => story_uid,
      'owner' => mock_valid_user
    }
  end

  before do
    allow(CoreServer).to receive(:get_view).and_return(core_view_response)
  end

  subject { PermissionsUpdater.new(user, user_authorization, story_uid) }

  describe '#initialize' do

    it 'initializes with user, story uid, and headers for core' do
      expect {
        PermissionsUpdater.new(user, user_authorization, story_uid)
      }.to_not raise_error
    end

    it 'raises without story_uid' do
      expect {
        PermissionsUpdater.new(user, user_authorization)
      }.to raise_error(ArgumentError, /2 for 3/)
    end

    it 'raises without user_authorization' do
      expect {
        PermissionsUpdater.new(user)
      }.to raise_error(ArgumentError, /1 for 3/)
    end
  end

  describe '#update_permissions' do

    it 'marks story as public' do
      expect(CoreServer).to receive(:update_permissions).with(
        story_uid,
        {
          accessType: 'WEBSITE',
          method: 'setPermission',
          value: 'public.read'
        }
      ).and_return(true)

      subject.update_permissions(is_public: true)
    end

    it 'marks story as private' do
      expect(CoreServer).to receive(:update_permissions).with(
        story_uid,
        {
          accessType: 'WEBSITE',
          method: 'setPermission',
          value: 'private'
        }
      ).and_return(true)

      subject.update_permissions(is_public: false)
    end

    context 'when no view is returned from core' do
      let(:core_view_response) { nil }

      it 'raises error' do
        expect { subject.update_permissions(is_public: true) }.to raise_error(
          ArgumentError,
          /Must initialize PermissionsUpdater service object with valid uid./
        )
      end
    end

    context 'when view has owner different than current user and user does not have the update_view right.' do
      let(:user) { mock_valid_user.tap{ |user| user['id'] = 'bugs-bnny' } }
      let(:user_authorization) { mock_user_authorization.tap{ |user_authorization| user_authorization['domainRights'] = [] } }

      it 'returns false' do
        expect(subject.update_permissions(is_public: true)).to be false
      end
    end
  end
end
