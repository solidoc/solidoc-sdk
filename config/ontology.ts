const idToAlias = {
  'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': 'type',
  'http://purl.org/dc/terms/title': 'title',
  'http://www.solidoc.net/ontologies#firstChild': 'firstChild',
  'http://www.solidoc.net/ontologies#nextNode': 'next',
  'http://www.solidoc.net/ontologies#options': 'options',
  'http://www.solidoc.net/ontologies#text': 'text',
};

const idToType = {
  'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': 'NamedNode',
  'http://purl.org/dc/terms/title': 'Text',
  'http://www.solidoc.net/ontologies#firstChild': 'NamedNode',
  'http://www.solidoc.net/ontologies#nextNode': 'NamedNode',
  'http://www.solidoc.net/ontologies#options': 'Json',
  'http://www.solidoc.net/ontologies#text': 'Text',
};

const ont = {
  rdf: {
    type: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
  },
  dct: {
    title: 'http://purl.org/dc/terms/title',
  },
  sdoc: {
    firstChild: 'http://www.solidoc.net/ontologies#firstChild',
    next: 'http://www.solidoc.net/ontologies#nextNode',
    text: 'http://www.solidoc.net/ontologies#text',
    options: 'http://www.solidoc.net/ontologies#options',
    root: 'http://www.solidoc.net/ontologies#Root',
    leaf: 'http://www.solidoc.net/ontologies#Leaf',
    branch: 'http://www.solidoc.net/ontologies#Branch',
    paragraph: 'http://www.solidoc.net/ontologies#Paragraph',
    numberedList: 'http://www.solidoc.net/ontologies#NumberedList',
  },
};

export { ont, idToAlias, idToType };
