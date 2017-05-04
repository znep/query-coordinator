require 'rails_helper'

RSpec.describe CorePermissionsUpdater do

  let(:story_uid) { 'abcd-efgh' }
  let(:core_view_response) do
    {
      'id' => story_uid,
      'owner' => mock_valid_user
    }
  end

  before do
    allow(CoreServer).to receive(:current_user_story_authorization).and_return(mock_user_authorization_super_admin)
    allow(CoreServer).to receive(:get_view).and_return(core_view_response)
  end

  subject { CorePermissionsUpdater.new(story_uid) }

  describe '#initialize' do

    it 'initializes with story uid' do
      expect {
        subject
      }.to_not raise_error
    end

    it 'raises without story_uid' do
      expect {
        CorePermissionsUpdater.new
      }.to raise_error(ArgumentError)
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
        expect { subject.update_permissions(is_public: true) }.to raise_error(ArgumentError)
      end
    end

    context 'when user lacks authorization to update permissions' do
      before do
        allow(CoreServer).to receive(:current_user_story_authorization).and_return(mock_user_authorization_unprivileged)
      end

      it 'returns false' do
        expect(subject.update_permissions(is_public: true)).to be false
      end
    end
  end
end