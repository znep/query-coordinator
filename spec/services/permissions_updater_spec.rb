require 'rails_helper'

RSpec.describe PermissionsUpdater do

  let(:user) { mock_valid_user }
  let(:story_uid) { 'abcd-efgh' }
  let(:core_request_headers) do
    {
      'X-Socrata-Host' => 'test-domain.com',
      'X-CSRF-Token' => 'a-token-of-our-appreciation',
      'Cookie' => 'cookies are sometimes food'
    }
  end
  let(:core_view_response) do
    {
      'id' => story_uid,
      'owner' => mock_valid_user
    }
  end

  before do
    allow(CoreServer).to receive(:get_view).and_return(core_view_response)
  end

  subject { PermissionsUpdater.new(user, story_uid, core_request_headers) }

  describe '#initialize' do

    it 'initializes with user, story uid, and headers for core' do
      expect {
        PermissionsUpdater.new(user, story_uid, core_request_headers)
      }.to_not raise_error
    end

    it 'raises without core_request_headers' do
      expect {
        PermissionsUpdater.new(user, story_uid)
      }.to raise_error(ArgumentError, /2 for 3/)
    end

    it 'raises without story_uid' do
      expect {
        PermissionsUpdater.new(user)
      }.to raise_error(ArgumentError, /1 for 3/)
    end
  end

  describe '#update_permissions' do

    it 'marks story as public' do
      expect(CoreServer).to receive(:update_permissions).with(
        story_uid,
        core_request_headers,
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
        core_request_headers,
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
          /Must initialize Permissions service object with valid uid./
        )
      end
    end

    context 'when core_request_headers are empty' do
      let(:core_request_headers) { nil }

      it 'raises error' do
        expect { subject.update_permissions(is_public: true) }.to raise_error(
          ArgumentError,
          /Must initialize Permissions service object with valid core_request_headers./
        )
      end
    end

    context 'when view has owner different than current user' do
      let(:user) { mock_valid_user.tap{ |user| user['id'] = 'bugs-bnny' } }

      it 'raises error' do
        expect { subject.update_permissions(is_public: true) }.to raise_error(
          ArgumentError,
          /Must initialize Permissions service object with valid uid./
        )
      end
    end

  end

end
