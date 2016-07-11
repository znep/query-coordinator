require 'rails_helper'

describe Domain do
  describe '#has_valid_salesforce_id?' do
    subject { Domain.new({ 'salesforceId' => salesforceId }) }

    context 'for a domain with no SFDC ID' do
      subject { Domain.new }

      it 'should return something falsey' do
        expect(subject.has_valid_salesforce_id?).to be_falsey
      end
    end

    context 'for a 15-character SFDC ID' do
      let(:salesforceId) { '006F000000hJozp' }
      it 'should return true' do
        expect(subject.has_valid_salesforce_id?).to be_truthy
      end
    end

    context 'for a 18-character SFDC ID' do
      let(:salesforceId) { '001A0000003HdUAIA0' }
      it 'should return true' do
        expect(subject.has_valid_salesforce_id?).to be_truthy
      end
    end

    context 'for an SFDC ID invalid because of size' do
      let(:salesforceId) { '12345' }
      it 'should return false' do
        expect(subject.has_valid_salesforce_id?).to be_falsey
      end
    end

    context 'for an SFDC ID invalid because of characters' do
      let(:salesforceId) { '12345678901234_' }
      it 'should return false' do
        expect(subject.has_valid_salesforce_id?).to be_falsey
      end
    end
  end
end
