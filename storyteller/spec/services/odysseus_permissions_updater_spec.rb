require 'rails_helper'

RSpec.describe OdysseusPermissionsUpdater do

  let(:story_uid) { 'abcd-efgh' }
  let(:goal) { instance_double(OpenPerformance::Goal) }
  let(:odysseus_response) { instance_double(HttpResponse) }

  before do
    allow(CoreServer).to receive(:current_user_story_authorization).and_return(mock_user_authorization_super_admin)

    allow(odysseus_response).to receive(:ok?).and_return(true)

    allow(goal).to receive(:accessible?).and_return(true)
    allow(OpenPerformance::Goal).to receive(:new).and_return(goal)
    stub_current_domain
    set_features(['govstat'])
  end

  subject { OdysseusPermissionsUpdater.new(story_uid) }

  describe '#initialize' do

    it 'initializes with story uid' do
      expect {
        subject
      }.to_not raise_error
    end

    it 'raises without story_uid' do
      expect {
        OdysseusPermissionsUpdater.new
      }.to raise_error(ArgumentError)
    end
  end

  describe '#update_permissions' do

    it 'marks goal as public' do
      expect(OpenPerformance::Odysseus).to receive(:set_goal_visibility).with(
        story_uid,
        true
      ).and_return(odysseus_response)

      subject.update_permissions(is_public: true)
    end

    it 'marks story as private' do
      expect(OpenPerformance::Odysseus).to receive(:set_goal_visibility).with(
        story_uid,
        false
      ).and_return(odysseus_response)

      subject.update_permissions(is_public: false)
    end

    context 'when no goal is available' do
      before do
        allow(goal).to receive(:accessible?).and_return(false)
      end

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
