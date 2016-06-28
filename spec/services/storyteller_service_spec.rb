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
end
