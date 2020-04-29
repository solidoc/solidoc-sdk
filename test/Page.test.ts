import { Page } from '../src/Page';
import { config as cfg, turtle } from '../config/test';
import { ont } from '../config/ontology';
import { Operation } from '../src/interface';
import * as assert from 'power-assert';

let page: Page;

describe('Create Page', () => {
  let turtleAll = '';
  turtleAll += turtle.page + '\n';
  turtleAll += turtle.para.join('\n') + '\n';
  turtleAll += turtle.text.join('\n') + '\n';

  it('parses from quads', () => {
    page = new Page(cfg.page.id, turtleAll);
    assert.deepStrictEqual(page.toJson(), cfg.page);
  });
});

describe('Insert Node', () => {
  let op0: Operation;

  beforeEach(() => {
    page = new Page(
      cfg.page.id,
      `<${cfg.page.id}> <${ont.dct.title}> "${cfg.page.title}".`,
    );
    op0 = {
      type: 'insert_node',
      path: [0],
      node: cfg.para[0],
    };
  });

  it('inserts a paragraph', () => {
    page.apply(op0);

    assert.deepStrictEqual(page.toJson().children[0], cfg.para[0]);
    assert(page.getSubject(cfg.para[0].id).isInserted());
    assert(page.getSubject(cfg.text[0].id).isInserted());
  });

  it('applies no change if operation is failed', () => {
    op0.path = [10, 0];
    assert.throws(() => {
      page.apply(op0);
    }, /^Error: Cannot find a descendant/);
    assert.throws(() => {
      page.getSubject(op0.node.id);
    }, /^Error: Subject not found/);
  });

  it('disallows inserting a duplicated node', () => {
    page.apply(op0);
    assert.throws(() => {
      page.apply(op0);
    }, /^Error: Duplicated node insertion/);
  });

  it('gets sparql', () => {
    page.apply(op0);
    page.getSparqlForUpdate();

    assert(page.getRoot().getProperty('firstChild'), cfg.para[0].id);
    assert(page.getSubject(cfg.para[0].id).toJson(), cfg.para[0]);
  });

  it('undoes', () => {
    page.apply(op0);
    page.undo();

    assert.deepStrictEqual(page.toJson(), page.getRoot().toJson());
    assert.throws(() => {
      page.getSubject(cfg.para[0].id);
    });
    assert.throws(() => {
      page.getSubject(cfg.text[0].id);
    });
  });
});
