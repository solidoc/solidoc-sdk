import { Page } from '../src/Page';
import { config as cfg, turtle } from '../config/test';
import { ont } from '../config/ontology';
import { Operation } from '../src/interface';
import * as assert from 'power-assert';
import { updatePod } from './MockPod.test';

let page: Page;

let turtleAll = '';
turtleAll += turtle.page + '\n';
turtleAll += turtle.para.join('\n') + '\n';
turtleAll += turtle.text.join('\n') + '\n';

describe('Create Page', () => {
  it('parses from quads', () => {
    page = new Page(cfg.page.id, turtleAll);
    assert.deepStrictEqual(page.toJson(), cfg.page);

    page.update();
    const sparql = page.getSparqlForUpdate();
    const turtleNew = updatePod(turtleAll, sparql, cfg.page.id);

    const pageNew = new Page(cfg.page.id, turtleNew);
    assert.deepStrictEqual(pageNew.toJson(), page.toJson());

    assert(page.toJson().modified > 0);
  });

  it('inserts type definition if not defined', () => {
    let turtle = `<${cfg.page.id}> <${ont.dct.modified}> "${new Date(0)}"^^<${
      ont.xsd.dateTime
    }> .`;
    page = new Page(cfg.page.id, turtle);

    page.update();
    const sparql = page.getSparqlForUpdate();
    const turtleNew = updatePod(turtle, sparql, cfg.page.id);

    const pageNew = new Page(cfg.page.id, turtleNew);
    assert.deepStrictEqual(pageNew.toJson(), page.toJson());
  });
});

describe('Insert Node', () => {
  let op0: Operation;

  beforeEach(() => {
    page = new Page(
      cfg.page.id,
      `<${cfg.page.id}> a <${ont.sdoc.root}>; <${ont.dct.title}> "${cfg.page.title}".`,
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
    assert(page.getSubject(cfg.para[0].id).isInserted);
    assert(page.getSubject(cfg.text[0].id).isInserted);
  });

  it('applies no insertion if operation is failed', () => {
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
    page.update();
    page.commit();

    assert.strictEqual(
      page.getValue(cfg.page.id, ont.sdoc.firstChild),
      cfg.para[0].id,
    );
    // assert(page.getSubject(cfg.para[0].id).toJson(), cfg.para[0]);
  });

  it('undoes', () => {
    page.apply(op0);
    page.undo();

    // assert.deepStrictEqual(page.get(), page.getRoot().toJson());
    assert.throws(() => {
      page.getSubject(cfg.para[0].id);
    });
    assert.throws(() => {
      page.getSubject(cfg.text[0].id);
    });
  });
});

describe('Split Node', () => {
  let op0: Operation;

  beforeEach(() => {
    page = new Page(cfg.page.id, turtleAll);

    op0 = {
      type: 'split_node',
      path: [0],
      position: 1,
      properties: {
        id: cfg.page.id + '#temp',
      },
    };
  });

  it('splits a paragraph', () => {
    page.apply(op0);

    assert(page.getSubject(cfg.page.id + '#temp').isInserted);
  });

  it('disallows duplicated node', () => {
    page.apply(op0);

    assert.throws(() => {
      page.apply(op0);
    }, /^Error: Duplicated node insertion/);
  });

  it('commits splitting', () => {
    page.apply(op0);
    page.update();
    page.commit();

    assert(!page.getSubject(cfg.page.id + '#temp').isInserted);
  });

  it('undoes splitting', () => {
    page.apply(op0);
    page.update();
    page.undo();

    assert.throws(() => {
      page.getSubject(cfg.page.id + '#temp');
    }, /^Error: Subject not found/);
  });
});

describe('Remove Node', () => {
  let op0: Operation;
  let op1: Operation;
  let op2: Operation;

  beforeEach(() => {
    page = new Page(cfg.page.id, turtleAll);

    op0 = {
      type: 'remove_node',
      path: [0],
    };
    op1 = {
      type: 'remove_node',
      path: [0, 0],
    };
    op2 = {
      type: 'insert_node',
      path: [0],
      node: cfg.para[0],
    };
  });

  it('removes a paragraph', () => {
    page.apply(op0);

    assert(page.getSubject(cfg.para[0].id).isDeleted);
    assert(page.getSubject(cfg.text[0].id).isDeleted);
  });

  it('removes a text', () => {
    page.apply(op1);
    page.apply(op1);
    page.apply(op1);
    page.update();
    page.commit();

    assert.strictEqual(
      page.getValue(cfg.para[0].id, ont.sdoc.firstChild),
      undefined,
    );
  });

  it('inserts a deleted subject', () => {
    page.apply(op0);
    page.apply(op2);

    page.update();
    assert.deepStrictEqual(page.toJson().children[0], cfg.para[0]);
  });

  it('commits removal', () => {
    page.apply(op0);
    page.update();
    page.commit();

    assert.throws(() => {
      page.getSubject(cfg.para[0].id);
    }, /^Error: Subject not found/);

    assert.throws(() => {
      page.getSubject(cfg.text[0].id);
    }, /^Error: Subject not found/);
  });

  it('undoes removal', () => {
    page.apply(op0);
    page.update();
    page.undo();

    assert(!page.getSubject(cfg.para[0].id).isDeleted);
    assert(!page.getSubject(cfg.text[0].id).isDeleted);
  });
});

describe('Merge Node', () => {
  let op0: Operation;

  beforeEach(() => {
    page = new Page(cfg.page.id, turtleAll);

    op0 = {
      type: 'merge_node',
      path: [1],
    };
  });

  it('merges a paragraph', () => {
    page.apply(op0);

    assert(page.getSubject(cfg.para[1].id).isDeleted);
  });

  it('commits merging', () => {
    page.apply(op0);
    page.update();
    page.commit();

    assert.throws(() => {
      page.getSubject(cfg.para[1].id);
    }, /^Error: Subject not found/);
  });

  it('undoes merging', () => {
    page.apply(op0);
    page.update();
    page.undo();

    assert(!page.getSubject(cfg.para[1].id).isDeleted);
  });
});

describe('Set Node', () => {
  let op0: Operation;

  beforeEach(() => {
    page = new Page(cfg.page.id, turtleAll);

    op0 = {
      type: 'set_node',
      path: [0, 0],
      newProperties: {
        bold: null,
      },
    };
  });

  it('set a paragraph', () => {
    page.apply(op0);

    assert.deepStrictEqual(page.toJson().children[0].children[0], {
      id: cfg.text[0].id,
      type: cfg.text[0].type,
      text: cfg.text[0].text,
    });
  });

  it('updates the subject', () => {
    page.apply(op0);
    page.update();
    page.commit();

    assert.strictEqual(page.getValue(cfg.text[0].id, ont.sdoc.bold), false);
  });
});
