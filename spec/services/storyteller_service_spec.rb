require 'rails_helper'

RSpec.describe StorytellerService do
  describe '#active?' do
    let(:subject) { StorytellerService.active? }

    context 'when no connection to consul' do
      before do
        allow_any_instance_of(Diplomat::Kv).to receive(:get).and_raise(Faraday::ConnectionFailed.new(nil))
      end

      it 'is true' do
        expect(subject).to eq(true)
      end
    end

    context 'when consul does not contain key' do
      before do
        allow_any_instance_of(Diplomat::Kv).to receive(:get).and_raise(Diplomat::KeyNotFound.new)
      end

      it 'is true' do
        expect(subject).to eq(true)
      end
    end

    context 'when key and value exist in consul' do
      let(:active_version) { nil }
      let(:current_version) { nil }

      before do
        allow_any_instance_of(Diplomat::Kv).to receive(:get).and_return(active_version)
        allow(Rails.application.config).to receive(:version).and_return(current_version)
      end

      context 'when value in consul does not match current rails version' do
        let(:active_version) { 'def' }
        let(:current_version) { 'abc' }

        it 'is false' do
          expect(subject).to eq(false)
        end
      end

      context 'when value in consul matches current rails version' do
        let(:active_version) { 'abc' }
        let(:current_version) { 'abc' }

        it 'is true' do
          expect(subject).to eq(true)
        end
      end

      context 'when value in consul is nil' do
        let(:active_version) { nil }
        let(:current_version) { 'abc' }

        it 'is true' do
          expect(subject).to eq(true)
        end
      end
    end
  end

  describe '#downtimes' do
    let(:subject) { StorytellerService.downtimes }

    context 'when no connection to consul' do
      before do
        allow_any_instance_of(Diplomat::Kv).to receive(:get).and_raise(Faraday::ConnectionFailed.new(nil))
      end

      it 'is an empty array' do
        expect(subject).to eq([])
      end
    end

    context 'when consul does not contain key' do
      before do
        allow_any_instance_of(Diplomat::Kv).to receive(:get).and_raise(Diplomat::KeyNotFound.new)
      end

      it 'is an empty array' do
        expect(subject).to eq([])
      end
    end

    context 'when key and value exist in consul' do
      let(:downtimes) { nil }
      let(:valid_keys) { ['message_start', 'message_end', 'downtime_start', 'downtime_end'] }

      before do
        allow_any_instance_of(Diplomat::Kv).to receive(:get).and_return(downtimes)
      end

      context 'when value in consul matches the current environment and contains a hash' do
        let(:downtimes) { fixture('downtime.yml').read }

        it 'is an array of the downtimes' do
          expect(subject.size).to eql(1)
          expect(subject.first.keys).to match_array(valid_keys)
        end
      end

      context 'when value in consul matches the current environment and contains an array' do
        let(:downtimes) { fixture('downtimes.yml').read }

        it 'is an array of the downtimes' do
          expect(subject.size).to eql(2)
          expect(subject.first.keys).to match_array(valid_keys)
          expect(subject.second.keys).to match_array(valid_keys)
        end
      end

      context 'when value in consul has no entries for the current environment' do
        let(:downtimes) { fixture('downtime.yml').read }

        before do
          allow(Rails.application.config).to receive(:downtime_config_env).and_return('stub')
        end

        it 'is an empty array' do
          expect(subject).to eq([])
        end
      end

      context 'when value in consul is not well-formed YAML' do
        let(:downtimes) { 'foo: foo: foo' }

        it 'is an empty array' do
          expect(subject).to eq([])
        end
      end

      context 'when value in consul is empty' do
        let(:downtimes) { '' }

        it 'is an empty array' do
          expect(subject).to eq([])
        end
      end
    end
  end
end
