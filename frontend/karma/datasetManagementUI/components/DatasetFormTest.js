import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import DatasetForm from 'components/DatasetForm/DatasetForm';

describe('components/Forms/DatasetForm', () => {
  const defaultProps = {
    regularFieldsets: [
      {
        title: 'Title and Description',
        subtitle:
          'Make your title and description as clear and simple as possible.',
        fields: [
          {
            data: {
              name: 'name',
              label: 'Dataset Title',
              value: 'ok',
              isPrivate: false,
              isRequired: true,
              placeholder: 'Dataset Title',
              isCustom: false
            }
          },
          {
            data: {
              name: 'description',
              label: 'Brief Description',
              isPrivate: false,
              isRequired: false,
              placeholder: 'Enter a description'
            }
          }
        ]
      },
      {
        title: 'Row Label',
        subtitle: 'Row Label Stuff',
        fields: [
          {
            data: {
              name: 'row_label',
              label: 'Row Label',
              isPrivate: false,
              isRequired: false,
              placeholder: 'Enter a row label'
            }
          }
        ]
      },
      {
        title: 'Categories and Tags',
        subtitle: 'Categorize your dataset to make it easier to find.',
        fields: [
          {
            data: {
              name: 'category',
              label: 'Category',
              value: 'Education',
              isPrivate: false,
              isRequired: false,
              isCustom: false
            },
            options: [
              {
                title: '-- No category --',
                value: ''
              },
              {
                title: 'Business',
                value: 'Business'
              },
              {
                title: 'Education',
                value: 'Education'
              },
              {
                title: 'Fun',
                value: 'Fun'
              },
              {
                title: 'Government',
                value: 'Government'
              },
              {
                title: 'Illegal',
                value: 'Illegal'
              },
              {
                title: 'Personal',
                value: 'Personal'
              }
            ]
          },
          {
            data: {
              name: 'tags',
              label: 'Tags / Keywords',
              value: ['one', 'four', 'three'],
              isPrivate: false,
              isRequired: false,
              placeholder: 'Enter tag name'
            }
          }
        ]
      },
      {
        title: 'Licensing & Attribution',
        subtitle: null,
        fields: [
          {
            data: {
              name: 'licenseId',
              label: 'License Type',
              value: null,
              isPrivate: false,
              isRequired: false,
              isCustom: false
            },
            options: [
              {
                title: '-- No License --',
                value: ''
              },
              {
                title: 'Canada Open Government Licence',
                value: 'OGL_CANADA'
              },
              {
                title:
                  'Creative Commons 1.0 Universal (Public Domain Dedication)',
                value: 'CC0_10'
              },
              {
                title: 'Creative Commons Attribution 3.0 Australia',
                value: 'CC_30_BY_AUS'
              },
              {
                title: 'Creative Commons Attribution 3.0 IGO',
                value: 'CC_30_BY_IGO'
              },
              {
                title: 'Creative Commons Attribution 3.0 New Zealand',
                value: 'CC_30_BY_NZ'
              },
              {
                title: 'Creative Commons Attribution 3.0 Unported',
                value: 'CC_30_BY'
              },
              {
                title: 'Creative Commons Attribution 4.0 International',
                value: 'CC_40_BY'
              },
              {
                title:
                  'Creative Commons Attribution | No Derivative Works 3.0 Unported',
                value: 'CC_30_BY_ND'
              },
              {
                title:
                  'Creative Commons Attribution | NoDerivatives 4.0 International License',
                value: 'CC_40_BY_ND'
              },
              {
                title:
                  'Creative Commons Attribution | Noncommercial 3.0 New Zealand',
                value: 'CC_30_BY_NC_NZ'
              },
              {
                title:
                  'Creative Commons Attribution | Noncommercial 3.0 Unported',
                value: 'CC_30_BY_NC'
              },
              {
                title:
                  'Creative Commons Attribution | Noncommercial | No Derivative Works 3.0 IGO',
                value: 'CC_30_BY_NC_ND_IGO'
              },
              {
                title:
                  'Creative Commons Attribution | Noncommercial | No Derivative Works 3.0 Unported',
                value: 'CC_30_BY_NC_ND'
              },
              {
                title:
                  'Creative Commons Attribution | Noncommercial | Share Alike 3.0 New Zealand',
                value: 'CC_30_BY_NC_SA_NZ'
              },
              {
                title:
                  'Creative Commons Attribution | Noncommercial | Share Alike 3.0 Unported',
                value: 'CC_30_BY_NC_SA'
              },
              {
                title:
                  'Creative Commons Attribution | Share Alike 3.0 Unported',
                value: 'CC_30_BY_SA'
              },
              {
                title:
                  'Creative Commons Attribution | Share Alike 4.0 International',
                value: 'CC_40_BY_SA'
              },
              {
                title: 'Italian Open Data License 2.0',
                value: 'IODL'
              },
              {
                title: 'Nova Scotia Open Government Licence',
                value: 'OGL_NOVA_SCOTIA'
              },
              {
                title: 'Open Data Commons Attribution License',
                value: 'ODC_BY'
              },
              {
                title: 'Open Data Commons Open Database License',
                value: 'ODBL'
              },
              {
                title: 'Open Data Commons Public Domain Dedication and License',
                value: 'PDDL'
              },
              {
                title: 'Public Domain',
                value: 'PUBLIC_DOMAIN'
              },
              {
                title: 'Public Domain U.S. Government',
                value: 'USGOV_WORKS'
              },
              {
                title: 'See Terms of Use',
                value: 'SEE_TERMS_OF_USE'
              },
              {
                title:
                  'Standard Reference Data Copyright U.S. Secretary of Commerce',
                value: 'NIST_SRD'
              },
              {
                title: 'UK Open Government Licence v3',
                value: 'UK_OGLV3.0'
              }
            ]
          },
          {
            data: {
              name: 'attribution',
              label: 'Data Provided By',
              value: null,
              isPrivate: false,
              isRequired: false,
              placeholder: 'Individual or organization',
              isCustom: false
            }
          },
          {
            data: {
              name: 'attributionLink',
              label: 'Source Link',
              value: null,
              isPrivate: false,
              isRequired: false,
              placeholder: 'Enter web address',
              isCustom: false
            }
          }
        ]
      },
      {
        title: 'Contact Email',
        subtitle: null,
        fields: [
          {
            data: {
              name: 'contactEmail',
              label: 'Email Address',
              value: null,
              isPrivate: true,
              isRequired: false,
              placeholder: 'example@socrata.com',
              isCustom: false
            }
          }
        ]
      },
      {
        title: 'Attachments',
        subtitle: null,
        fields: [
          {
            data: {
              name: 'attachments',
              label: 'attachments',
              value: [],
              isPrivate: false,
              isRequired: false,
              placeholder: false,
              isCustom: false
            }
          }
        ]
      }
    ],
    customFieldsets: [
      {
        title: 'FS One',
        subtitle: null,
        fields: [
          {
            data: {
              name: 'name',
              label: 'name',
              value: null,
              isRequired: false,
              placeholder: null,
              isCustom: true
            }
          }
        ]
      }
    ],
    setErrors: () => {}
  };

  it('renders correctly', () => {
    const component = shallow(<DatasetForm {...defaultProps} />);
    assert.lengthOf(component.find('form'), 1);
    assert.lengthOf(component.find('Fieldset'), 7);
    assert.lengthOf(component.find('withRouter(Connect(Field))'), 11);
  });
});
