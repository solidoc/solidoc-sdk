import { Subject } from '../src/Subject'
import { Branch, Leaf, createNodes } from '../src/Node';
import { config } from '../config/test'
import * as assert from 'power-assert';

const nodeMap = new Map<string, Subject>();

const para0 = config.para[0]

describe('Branch', () => {
  let branch: Branch
  let leaf0: Leaf
  let leaf1: Leaf
  let leaf2: Leaf

  let leaf3: Leaf
  let leaf4: Leaf

  beforeEach(() => {
    branch = <Branch>createNodes(para0, nodeMap);

    leaf0 = <Leaf>branch.getIndexedChild(0)
    leaf1 = <Leaf>branch.getIndexedChild(1)
    leaf2 = <Leaf>branch.getIndexedChild(2)

    leaf3 = <Leaf>createNodes(config.text[3], nodeMap);
    leaf4 = <Leaf>createNodes(config.text[4], nodeMap);
    leaf3.setNext(leaf4)
  });

  describe('Insertion', () => {

    it('converts to Json', () => {
      assert.deepStrictEqual(branch.toJson(), para0)
    });

    it('inserts children to the beginning', () => {
      branch.attachChildren(leaf3, 0);
      assert.strictEqual(branch.getChildrenNum(), 5);
      assert.strictEqual(branch.getIndexedChild(0), leaf3)
      assert.strictEqual(branch.getLastChild(), leaf2)
    })

    it('inserts children to the middle', () => {
      branch.attachChildren(leaf3, 1);
      assert.strictEqual(branch.getChildrenNum(), 5);
      assert.strictEqual(branch.getIndexedChild(2), leaf4)
    })

    it('inserts children to the tail', () => {
      branch.attachChildren(leaf3, Infinity);
      assert.strictEqual(branch.getChildrenNum(), 5);
      assert.strictEqual(branch.getLastChild(), leaf4)
    })

    it('inserts children to offset < 0', () => {
      branch.attachChildren(leaf3, -1);
      assert.strictEqual(branch.getChildrenNum(), 5);
      assert.strictEqual(branch.getIndexedChild(0), leaf3);
    })

    it('throws on inserting an undefined child', () => {
      try {
        branch.attachChildren(undefined, 0)
      } catch (e) {
        return
      }
      assert(0)
    })
  })

  describe('Deletion', () => {

    beforeEach(() => {
      branch = <Branch>createNodes(para0, nodeMap);

      leaf0 = <Leaf>branch.getIndexedChild(0)
      leaf1 = <Leaf>branch.getIndexedChild(1)
      leaf2 = <Leaf>branch.getIndexedChild(2)
    })

      it('throws on deleting if length <= 0', () => {
        try {
          branch.detachChildren(0, 0)
        } catch (e) {
          return
        }
        assert(0)
      });

      it('deletes at the beginning', () => {
        branch.detachChildren(0, 1);
        assert.strictEqual(branch.getChildrenNum(), 2);
        assert.strictEqual(branch.getIndexedChild(0), leaf1)
        assert.strictEqual(branch.getIndexedChild(1), leaf2)
      })

      it('deletes in the middle', () => {
        branch.detachChildren(1, 2);
        assert.strictEqual(branch.getChildrenNum(), 1);
        assert.strictEqual(branch.getIndexedChild(0), leaf0)
      })

      it('deletes all', () => {
        branch.detachChildren(0, Infinity);
        assert.strictEqual(branch.getChildrenNum(), 0)
      })

  })

});

