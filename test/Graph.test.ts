import { config, turtle } from '../config/test'
import { ont } from '../config/ontology';
import * as assert from 'power-assert';

import { Graph } from '../src/Graph';
import { Root, Branch, Leaf } from '../src/Node'
import { Subject } from '../src/Subject';



describe('Graph', () => {
  let graph: Graph;
  let root: Subject | undefined
  let turtleAll = '';
  turtleAll += turtle.page + '\n';
  turtleAll += turtle.para.join('\n') + '\n'
  turtleAll += turtle.text.join('\n') + '\n'

  beforeEach(() => {
    graph = new Graph(config.page.id, turtleAll)
    root = graph.getRoot()
  })

  describe('Constructor', () => {

    it('constructs the root node', () => {
      assert(root instanceof Root)
      assert.strictEqual(root, graph.getNode(config.page.id))
      assert.strictEqual(root?.isDeleted(), false)
      assert.strictEqual(root?.isFromPod(), true)
    })

    it('constructs branch nodes', () => {
      let branch0 = graph.getNode(config.para[0].id)
      let branch1 = graph.getNode(config.para[1].id)
      let branch2 = graph.getNode(config.para[2].id)

      assert(branch0 instanceof Branch);
      assert.strictEqual(branch0?.getNext(), branch1)
      assert.strictEqual(branch2?.getNext(), undefined)
    })

    it('constructs leaf nodes', () => {
      let leaf0 = graph.getNode(config.text[0].id)
      let leaf1 = graph.getNode(config.text[1].id)
      let leaf2 = graph.getNode(config.text[2].id)

      assert(leaf0 instanceof Leaf);
      assert.strictEqual(leaf0?.getNext(), leaf1)
      assert.strictEqual(leaf2?.getNext(), undefined)
    })

    it('does not construct a node without type definition', () => {
      let tempId = config.page.id + '#temp';
      let turtleTemp = turtleAll + `<${tempId}> <${ont.sdoc.text}> "ABC".`
      let tempGraph = new Graph(config.page.id, turtleTemp);

      assert.strictEqual(tempGraph.getNode(tempId), undefined)
    })

    it('does not construct a node with an unknown type')
    it('handles a node with multiple type definitions')

  })

  describe('Sparql-update', () => {

    it('generates null sparql when no change applied', () => {
      let sparql = graph.getSparqlForUpdate()

      assert(!sparql)
    })
  });

  describe('Commits and Undoes', () => {

    it('commits to remove deleted nodes from memory', () => {
      let branch0 = graph.getNode(config.para[0].id);
      branch0?.delete();
      graph.commit()

      assert.strictEqual(graph.getNode(config.para[0].id), undefined);
    });

    it('undoes to remove new nodes from memory', () => {
      let tempId = config.page.id + '#temp';
      graph.createNode({
        id: tempId,
        type: ont.sdoc.branch,
        children: []
      })
      graph.undo();

      assert.strictEqual(graph.getNode(tempId), undefined)
    })

    it('undoes to recover #nextNode', () => {
      let branch0 = graph.getNode(config.para[0].id)
      let branch1 = graph.getNode(config.para[1].id)
      branch0?.setNext(branch0); // meaningless and illegal, but ok for test
      graph.undo()

      assert.strictEqual(branch0?.getNext(), branch1)
    })

  })

});



