sh_languages['properties'] = [
  [
    [
      /#/g,
      'sh_comment',
      1
    ],
    [
      /!/g,
      'sh_comment',
      1
    ],
    [
      /([^="]+)([ \t]*)(=)/g,
      ['sh_type', 'sh_normal', 'sh_symbol'],
      -1
    ]
  ],
  [
    [
      /$/g,
      null,
      -2
    ]
  ]
];
