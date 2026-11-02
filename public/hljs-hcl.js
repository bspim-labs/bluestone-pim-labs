// HCL / Terraform grammar for highlight.js, which doesn't ship one.
// Load after highlight.min.js. Use ```hcl, ```terraform or ```tf in posts.
hljs.registerLanguage('hcl', function (hljs) {
  return {
    name: 'HCL',
    aliases: ['terraform', 'tf'],
    keywords: {
      keyword: 'resource data provider variable output locals module terraform import moved removed check for in if',
      literal: 'true false null'
    },
    contains: [
      hljs.HASH_COMMENT_MODE,
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      {
        className: 'string',
        begin: /"/,
        end: /"/,
        contains: [hljs.BACKSLASH_ESCAPE, { className: 'subst', begin: /\$\{/, end: /\}/ }]
      },
      // Attribute names: the identifier before a single "="
      { className: 'attr', begin: /\b[A-Za-z_][\w-]*(?=\s*=(?!=))/ },
      // Function calls such as jsonencode(...)
      { className: 'title.function', begin: /\b[a-z_]\w*(?=\()/ },
      hljs.C_NUMBER_MODE
    ]
  };
});
