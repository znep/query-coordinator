# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

# Seed Blocks

h1_presentable_block = Block.create(
  layout: '12',
  components: [
    {type: 'html', value: '<div><i>Block One!</i>&nbsp;Component One!<br></div>'}
  ],
  created_by: 'good-doer',
  presentable: true
)

h1_block = Block.create(
  layout: '12',
  components: [
    { type: 'html', value: '<h1 class="align-center" style="text-align:center">Your Great Story Title<br></h1>' }
  ],
  created_by: 'good-doer'
)

two_col_block = Block.create(
  layout: '6-6',
  components: [
    {type: 'html', value: '<div><i>Block Two!</i>&nbsp;Component One!<br></div>'},
    {type: 'html', value: '<div><i>Block Two!</i>&nbsp;Component Two!<br></div>'}
  ],
  created_by: 'good-doer',
  presentable: true
)

three_col_block = Block.create(
  layout: '4-4-4',
  components: [
    {type: 'html', value: '<div><i>Block Three!</i>&nbsp;Component One!<br></div>'},
    {type: 'html', value: '<div><i>Block Three!</i>&nbsp;Component Two!<br></div>'},
    {type: 'html', value: '<div><i>Block Three!</i>&nbsp;Component Three!<br></div>'}
  ],
  created_by: 'good-doer',
  presentable: true
)

four_col_block = Block.create(
  layout: '3-3-3-3',
  components: [
    {type: 'html', value: '<div><i>Block Four!</i>&nbsp;Component One!<br></div>'},
    {type: 'html', value: '<div><i>Block Four!</i>&nbsp;Component Two!<br></div>'},
    {type: 'html', value: '<div><i>Block Four!</i>&nbsp;Component Three!<br></div>'},
    {type: 'html', value: '<div><i>Block Four!</i>&nbsp;Component Four!<br></div>'}
  ],
  created_by: 'good-doer',
  presentable: true
)

horiz_rule_block = Block.create(
  layout: '12',
  components: [
    {type: 'horizontalRule'}
  ],
  created_by: 'good-doer',
  presentable: false
)

basic_anchor_block = Block.create(
  layout: '12',
  components: [
    { type: 'html', value: '<div><a href="https://opendata.socrata.com" target="_blank" rel="nofollow">Hello, Link!</a></div>' }
  ],
  created_by: 'good-doer'
)

embedded_html_block = Block.create(
  layout: '12',
  components: [
    {
      'type': 'embeddedHtml',
      'value': {
        'url': 'https://sa-storyteller-dev-us-west-2-staging.s3.amazonaws.com/documents/uploads/000/000/043/original/embedded_fragment.html?1448491145',
        'documentId': 43,
        'layout': {
          'height': 123
        }
      }
    }
  ],
  created_by: 'good-doer'
)

hero_block = Block.create(
  layout: '12',
  components: [
    {
      'type': 'hero',
      'value': {
        'html': '<h1 class="align-center" style="text-align:center">Your Great Story Title<br></h1>'
      }
    }
  ],
  created_by: 'good-doer'
)

image_with_link_block = Block.create(
  layout: '12',
  components: [
    {
      'type': 'image',
      'value': {
        'documentId': '1234',
        'url': 'https://bucket-name.s3.amazonaws.com/uploads/random/image.jpg',
        'link': 'http://example.com',
        'alt': 'image with link',
        'openInNewWindow': false
      }
    }
  ],
  created_by: 'good-doer'
)

image_block = Block.create(
  layout: '12',
  components: [
    {
      'type': 'image',
      'value': {
        'documentId': '1234',
        'url': 'https://bucket-name.s3.amazonaws.com/uploads/random/image.jpg',
        'alt': 'image without link'
      }
    }
  ],
  created_by: 'good-doer'
)

qualified_goal_block = Block.create(
  layout: '12',
  components: [
    {
      'type': 'goal.embed',
      'value': {
        dashboard: 'dash-bord',
        category: 'cate-gory',
        uid: 'goal-goal'
      }
    }
  ],
  created_by: 'perf-lord'
)

unqualified_goal_block = Block.create(
  layout: '12',
  components: [
    {
      'type': 'goal.embed',
      'value': {
        uid: 'goal-goal'
      }
    }
  ],
  created_by: 'perf-lord'
)

image_new_window_true_block = Block.create(
  layout: '12',
  components: [
    {
      'type': 'image',
      'value': {
        'documentId': '1234',
        'url': 'https://bucket-name.s3.amazonaws.com/uploads/random/image.jpg',
        'link': 'http://example.com',
        'alt': 'image with link and target _blank',
        'openInNewWindow': true
      }
    }
  ],
  created_by: 'good-doer'
)

# Seed Stories

PublishedStory.create(
  uid: 'test-test',
  block_ids: [
    h1_presentable_block,
    two_col_block,
    three_col_block,
    four_col_block
  ].map(&:id),
  created_by: 'good-doer',
  theme: 'serif'
)

DraftStory.create(
  uid: 'test-test',
  block_ids: [],
  created_by: 'good-doer',
  theme: 'serif'
)

DraftStory.create(
  uid: 'hasb-lock',
  block_ids: [
    h1_presentable_block,
    two_col_block,
    three_col_block,
    four_col_block
  ].map(&:id),
  created_by: 'good-doer',
  theme: 'serif'
)

DraftStory.create(
  uid: 'pres-ents',
  block_ids: [
    h1_presentable_block,
    two_col_block,
    three_col_block,
    horiz_rule_block,
    four_col_block
  ].map(&:id),
  created_by: 'good-doer',
  theme: 'serif'
)

PublishedStory.create(
  uid: 'pres-ents',
  block_ids: [
    h1_presentable_block,
    two_col_block,
    three_col_block,
    horiz_rule_block,
    four_col_block
  ].map(&:id),
  created_by: 'good-doer',
  theme: 'serif'
)

PublishedStory.create(
  uid: 'kchn-sink',
  block_ids: [
    h1_presentable_block,
    two_col_block,
    three_col_block,
    four_col_block,
    horiz_rule_block,
    h1_block,
    basic_anchor_block,
    embedded_html_block,
    hero_block,
    image_with_link_block,
    image_block
  ].map(&:id),
  created_by: 'good-doer',
  theme: 'serif'
)

PublishedStory.create(
  uid: 'link-blnk',
  block_ids: [image_new_window_true_block.id],
  created_by: 'good-doer',
  theme: 'serif'
)

PublishedStory.create(
  uid: 'link-self',
  block_ids: [image_with_link_block.id],
  created_by: 'good-doer',
  theme: 'serif'
)

DraftStory.create(
  uid: 'h1bl-ocks',
  block_ids: [h1_block.id],
  created_by: 'good-doer',
  theme: 'serif'
)

DraftStory.create(
  uid: 'href-bloc',
  block_ids: [h1_block.id, basic_anchor_block.id],
  created_by: 'good-doer',
  theme: 'serif'
)

DraftStory.create(
  uid: 'embd-html',
  block_ids: [embedded_html_block.id],
  created_by: 'good-doer',
  theme: 'serif'
)

DraftStory.create(
  uid: 'unpu-blsh',
  block_ids: [embedded_html_block.id],
  created_by: 'good-doer',
  theme: 'serif'
)

DraftStory.create(
  uid: 'hero-that',
  block_ids: [hero_block.id],
  created_by: 'good-doer',
  theme: 'serif'
)

DraftStory.create(
  uid: 'open-perf',
  block_ids: [qualified_goal_block.id],
  created_by: 'perf-lord',
  theme: 'serif'
)

DraftStory.create(
  uid: 'goal-twoo',
  block_ids: [unqualified_goal_block.id],
  created_by: 'auni-corn',
  theme: 'serif'
)

DraftStory.create(
  created_at: Time.parse('1-10-1988'),
  uid: 'many-draf',
  block_ids: [unqualified_goal_block.id],
  created_by: 'time-trvl',
  theme: 'serif'
)

DraftStory.create(
  created_at: Time.parse('1-10-1988') - 1.day,
  uid: 'many-draf',
  block_ids: [unqualified_goal_block.id],
  created_by: 'time-trvl',
  theme: 'serif'
)

DraftStory.create(
  created_at: Time.parse('1-10-1988') - 1.week,
  uid: 'many-draf',
  block_ids: [unqualified_goal_block.id],
  created_by: 'time-trvl',
  theme: 'serif'
)

PublishedStory.create(
  created_at: Time.parse('1-2-2000'),
  uid: 'many-publ',
  block_ids: [unqualified_goal_block.id],
  created_by: 'neil-amst',
  theme: 'serif'
)

PublishedStory.create(
  created_at: Time.parse('1-2-2000') - 1.day,
  uid: 'many-publ',
  block_ids: [unqualified_goal_block.id],
  created_by: 'bobb-ytbl',
  theme: 'serif'
)

PublishedStory.create(
  created_at: Time.parse('1-2-2000') - 1.week,
  uid: 'many-publ',
  block_ids: [unqualified_goal_block.id],
  created_by: 'some-prsn',
  theme: 'serif'
)

PublishedStory.create(
  created_at: Time.parse('1-2-2000') - 1.week,
  uid: 'neww-drft',
  block_ids: [unqualified_goal_block.id],
  created_by: 'some-prsn',
  theme: 'serif'
)
DraftStory.create(
  created_at: Time.parse('1-2-2000'),
  uid: 'neww-drft',
  block_ids: [unqualified_goal_block.id],
  created_by: 'some-prsn',
  theme: 'serif'
)
