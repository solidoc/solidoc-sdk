import { Branch, Root, Leaf, Node, Element, Process } from './Node';
import { Subject } from './Subject';
import { Graph } from './Graph';
import { Path, Operation } from './operation'

class Page extends Graph {
  constructor(json: Element) {
    super(json.id);
    this._insertRecursive(json);
  }

  private _insertRecursive = (json: Node, parent?: Branch, offset?: number) => {
    let currUri: string = (parent) ? this._uri + '#' + json.id : json.id
    let curr: Subject = this._addPlaceHolder(currUri, json.type);
    curr.set(json);

    parent && Process.attach(curr, parent, <number>offset);

    // TODO: this is O(n^2) complexity since attach() is O(n)
    for (let i = 0; curr instanceof Branch && i < json.children.length; i++) {
      this._insertRecursive(json.children[i], curr, i)
    }
  }

  protected _addPlaceHolder = (uri: string, type?: string): Subject => {
    if (this._nodes[uri] && !this._nodes[uri].isDeleted) {
      throw new Error('Trying to add an existing node: ' + uri);
    }
    // even if a marked-removed node exists, it should be recreated
    if (uri === this._uri) {
      this._nodes[uri] = new Root(uri, this)
    } else if (type === 'http://www.solidoc.net/ontologies#Leaf') {
      this._nodes[uri] = new Leaf(uri, this)
    } else {
      this._nodes[uri] = new Branch(uri, this)
    }
    return this._nodes[uri];
  }

  protected _getBranchInstance = (uri: string): Branch => {
    let node = this._nodes[uri];
    if (!node || node.isDeleted) {
      throw new Error('The node does not exist: ' + uri);
    } else if (!(node instanceof Branch)) {
      throw new Error('The request node is not a branch: ' + uri)
    }
    return node;
  }
  protected _getLeafInstance = (path: Path): Leaf => {
    let parent: Branch = this._getBranchInstance(path.parentUri);
    let node = parent.getChild(path.offset)
    if (!node || node.isDeleted) {
      throw new Error('The node does not exist: ' + path.parentUri + ' offset = ' + path.offset);
    } else if (!(node instanceof Leaf)) {
      throw new Error('The request node is not a branch: ' + path.parentUri + ' offset = ' + path.offset)
    }
    return node;
  }

  public toJson = (head?: Subject): Node => {
    if (!head) head = this._getRoot();
    const headJson = head.toJson();
    let curr = (head instanceof Branch) ? head.getChild(0) : undefined;

    while (curr) {
      let nodeJson = this.toJson(curr)
      headJson.children.push(nodeJson)

      curr = curr.getNext()
    }

    return headJson
  }

  public apply(op: Operation) {
    switch (op.type) {
      case 'insert_node': {
        let parent: Branch = this._getBranchInstance(op.path.parentUri);
        this._insertRecursive(op.node, parent, op.path.offset)
        break
      }

      case 'remove_node': {
        let parent: Branch = this._getBranchInstance(op.path.parentUri);
        let curr: Subject = Process.detach(parent, op.path.offset);
        curr && Process.removeRecursive(curr);
        break
      }

      case 'move_node': {
        let parent: Branch = this._getBranchInstance(op.path.parentUri);
        let newParent: Branch = this._getBranchInstance(op.newPath.parentUri);

        let curr: Subject = Process.detach(parent, op.path.offset);

        if (Process.isAncestor(curr, newParent)) {
          Process.attach(curr, parent, op.path.offset);
          throw new Error('Trying to append the node to itself or its descendent')
        }

        if (parent === newParent && op.path.offset < op.newPath.offset) {
          op.newPath.offset--;
        }
        Process.attach(curr, newParent, op.newPath.offset);
        break
      }

      case 'merge_node': {

        break
      }

      case 'split_node': {

        break
      }

      case 'set_node': {

        break
      }

      case 'insert_text': {
        const leaf = this._getLeafInstance(op.path);
        leaf.insertText(op.offset, op.text)
        break
      }

      case 'remove_text': {
        const leaf = this._getLeafInstance(op.path);
        leaf.removeText(op.offset, op.text.length);
        break
      }

      default: {
        break
      }

    }
  }
}

export { Page, Path, Operation }
