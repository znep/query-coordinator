require 'rails_helper'

describe DatasetLandingPageHelper do
  include TestHelperMethods

  before(:all) do
    init_current_domain
  end

  before(:each) do

    # This doesn't work if it's a let because the helper references the instance variable @view
    @view = View.new(
      'id' => 'asdf-1234',
      'columns' => [],
      'owner' => User.new,
      'newBackend?' => true
    )

    allow_any_instance_of(View).to receive(:migrations).and_return(
      'nbeId' => 'qwer-5678',
      'obeId' => 'asdf-1234'
    )
  end

  # This is a helper spec so we can't use TestHelperMethods for initializing the user
  let(:current_user) { nil }

  describe '#transformed_view' do
    describe 'rowCount' do
      it 'fetches the row count' do
        expect_any_instance_of(View).
          to receive(:row_count).
          and_return(5)

        expect(transformed_view[:rowCount]).to eq(5)
      end

      it 'uses 0 for the row count if the request fails' do
        expect_any_instance_of(View).
          to receive(:row_count).
          and_throw('oops')

        expect(transformed_view[:rowCount]).to eq(0)
      end
    end
  end
end
