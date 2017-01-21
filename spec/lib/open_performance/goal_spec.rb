require 'spec_helper'

describe OpenPerformance::Goal do
  let(:goal_uid) { 'test-goal' }
  let(:instance) { OpenPerformance::Goal.new(goal_uid) }

  let(:odysseus_status) { 200 }

  let(:odysseus_goal_response) { instance_double(HttpResponse) }
  let(:odysseus_goal_body) { nil }

  let(:odysseus_narrative_response) { instance_double(HttpResponse) }
  let(:odysseus_narrative_body) { nil }

  before do
    allow(OpenPerformance::Odysseus).to receive(:get_goal).and_return(odysseus_goal_response)
    allow(odysseus_goal_response).to receive(:code).and_return(odysseus_status)
    allow(odysseus_goal_response).to receive(:ok?).and_return(odysseus_status == 200)
    allow(odysseus_goal_response).to receive(:unauthorized?).and_return(odysseus_status == 401)
    allow(odysseus_goal_response).to receive(:json).and_return(odysseus_goal_body)

    allow(OpenPerformance::Odysseus).to receive(:get_goal_narrative).and_return(odysseus_narrative_response)
    allow(odysseus_narrative_response).to receive(:code).and_return(odysseus_status)
    allow(odysseus_narrative_response).to receive(:ok?).and_return(odysseus_status == 200)
    allow(odysseus_narrative_response).to receive(:json).and_return(odysseus_narrative_body)
  end

  shared_examples 'odysseus error forwarder' do
    context 'when there is an error' do
      let(:odysseus_status) { 500 }

      it 'should raise' do
        expect { instance.send(method) }.to raise_error("Data inaccessible #{odysseus_status}")
      end
    end
  end

  shared_examples 'goal metadata accessor' do |field|
    let(:field_value) { 'expected value' }
    let(:odysseus_goal_body) do
      {
        'id' => goal_uid,
        field => field_value
      }
    end

    it "returns metadata field #{field}" do
      expect(instance.send(method)).to eq(field_value)
    end
  end

  describe '#accessible?' do
    context 'when status is 200' do
      it 'returns true' do
        expect(instance.accessible?).to eq(true)
      end
    end

    context 'when status is not 200' do
      let(:odysseus_status) { 404 }

      it 'returns false' do
        expect(instance.accessible?).to eq(false)
      end
    end
  end

  describe '#unauthorized?' do
    context 'when status is 401' do
      let(:odysseus_status) { 401 }

      it 'returns true' do
        expect(instance.unauthorized?).to eq(true)
      end
    end

    context 'when status is not 401' do
      it 'returns false' do
        expect(instance.unauthorized?).to eq(false)
      end
    end
  end

  describe '#configured?' do
    context 'when goal is configured' do
      let(:odysseus_goal_body) do
        { 'prevailing_measure' => { 'start' => 'yesterday', 'end' => 'today' } }
      end

      it 'returns true' do
        expect(instance.configured?).to eq(true)
      end
    end

    context 'when goal is not configured' do
      let(:odysseus_goal_body) do
        {}
      end

      it 'returns false' do
        expect(instance.configured?).to eq(false)
      end
    end
  end

  describe '#title' do
    let(:method) { :title }
    it_behaves_like 'odysseus error forwarder'
    it_behaves_like 'goal metadata accessor', 'name'
  end

  describe '#public?' do
    let(:method) { :public? }
    it_behaves_like 'odysseus error forwarder'
    it_behaves_like 'goal metadata accessor', 'is_public'
  end

  describe '#owner_id' do
    let(:method) { :owner_id }
    it_behaves_like 'odysseus error forwarder'
    it_behaves_like 'goal metadata accessor', 'created_by'
  end

  describe '#updated_at' do
    let(:method) { :updated_at }
    it_behaves_like 'odysseus error forwarder'
    it_behaves_like 'goal metadata accessor', 'updated_at'
  end

  describe '#narrative_migration_metadata' do
    let(:method) { :narrative_migration_metadata }
    let(:odysseus_narrative_body) do
      { 'narrative' => [ 'foo' => 'bar' ] }
    end

    it_behaves_like 'odysseus error forwarder'

    it 'returns narrative' do
      expect(instance.narrative_migration_metadata).to eq(odysseus_narrative_body)
    end
  end
end
