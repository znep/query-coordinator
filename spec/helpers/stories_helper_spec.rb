require 'rails_helper'

RSpec.describe StoriesHelper, type: :helper do

  context '#render_block' do

    context 'when passed a block with a text component' do

      let(:block) do
        FactoryGirl.build(
          :block,
          :layout => '12',
          :components => [ { type: "text", value: "Hello, world!" } ]
        )
      end

      it 'renders html representing a block with a text component' do

        rendered_block = helper.render_block(block)

        expect(rendered_block).to match(/<div class="block">/)
        expect(rendered_block).to match(/<div class="component col12">/)
        expect(rendered_block).to match(/Hello, world!/)
      end
    end

    context 'when passed a block with an unrecognized component type' do

      let(:block) do
        FactoryGirl.build(
          :block,
          :layout => '12',
          :components => [ { type: "unrecognized", value: "Hello, world!" } ]
        )
      end

      it 'renders html representing a block with an empty component' do

        rendered_block = helper.render_block(block)

        expect(rendered_block).to match(/<div class="block">/)
        expect(rendered_block).to match(/<div class="component col12"><\/div>/)
      end
    end
  end
end
