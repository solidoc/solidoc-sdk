import { Predicate } from './Predicate';
import * as _ from 'lodash';

class Subject {
  protected _id: string;
  protected _type: string;
  protected _graph: string;
  protected _predicates: { [key: string]: Predicate };
  private _isDeleted: boolean = false;
  private _isInserted: boolean = false;

  private _valuesUpdated = new Map<Predicate, string>();
  private _valuesFromPod = new Map<Predicate, string>();

  constructor(
    id: string,
    type: string,
    graph: string,
    predicates: { [key: string]: Predicate },
  ) {
    this._id = id;
    this._type = type;
    this._graph = graph;
    this._predicates = predicates;
  }

  public fromQuad(quad: any) {
    if (!this._predicates[quad.predicate.id]) {
      return;
    }
    const pred: Predicate = this._predicates[quad.predicate.id];
    const value: string = pred.fromQuad(quad);
    this._valuesFromPod.set(pred, value);
    this._valuesUpdated.set(pred, value);
  }

  public get id(): string {
    return this._id;
  }

  public get type(): string {
    return this._type;
  }

  public getProperty(pred: Predicate): string {
    return this._valuesUpdated.get(pred) || pred.default;
  }

  public setProperty(pred: Predicate, value: string) {
    // TODO: should throw on getting 'next' for Root?
    this._valuesUpdated.set(pred, value);
    value === pred.default && this._valuesUpdated.delete(pred);
    // TODO: if type is set, also modify this._type
  }

  public getSparqlForUpdate = (): string => {
    if (this._isDeleted) {
      // TODO: for non-persisted subjects, this clause should be empty
      return `DELETE WHERE { GRAPH <${this._graph}> { <${this._id}> ?p ?o } };\n`;
    } else {
      let sparql = '';
      let allPred = new Set<Predicate>([
        ...this._valuesFromPod.keys(),
        ...this._valuesUpdated.keys(),
      ]);
      for (let pred of allPred) {
        sparql += pred.getSparql(
          this._id,
          this._valuesUpdated.get(pred),
          this._valuesFromPod.get(pred),
        );
      }
      return sparql;
    }
  };

  public commit = () => {
    if (this._isDeleted) {
      throw new Error('A deleted subject should not be committed');
    }

    this._valuesFromPod = _.cloneDeep(this._valuesUpdated);

    this._isInserted = false;
  };

  public undo() {
    if (this._isInserted) {
      throw new Error('A non-persisted subject should not be undone');
    }

    this._valuesUpdated = _.cloneDeep(this._valuesFromPod);

    this._isDeleted = false;
  }

  public delete() {
    if (this._id === this._graph) {
      throw new Error('The root is not removable :' + this._id);
    }
    this._isDeleted = true;
  }

  public isDeleted = (): boolean => {
    return this._isDeleted;
  };

  public isInserted = (): boolean => {
    return this._isInserted;
  };

  public insert = () => {
    this._isInserted = true;
  };
}

export { Subject };
