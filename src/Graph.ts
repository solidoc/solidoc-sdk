import { Subject } from './Subject';
import { Literal } from './Object';
import { Predicate } from './Predicate';
import * as n3 from 'n3';

// a graph could be a page or a database
class Graph {
  protected _id: string = '';
  protected _subjectMap = new Map<string, Subject>();
  protected _predicateMap = new Map<string, Predicate>();
  protected _updatedSubjs = new Set<Subject>();

  constructor(id: string, turtle: string) {
    this._id = id;
    this.createSubject(id);
    this._parseTurtle(turtle);

    this._subjectMap.forEach(subject => (subject.isInserted = false));
    this._updatedSubjs.clear();
  }

  public get id(): string {
    return this._id;
  }

  public createSubject = (subjectId: string): Subject => {
    let subject = this._subjectMap.get(subjectId);

    if (subject && !subject.isDeleted) {
      throw new Error('Duplicated subject creation: ' + subjectId);
    } else if (subject) {
      this.undeleteSubject(subjectId);
      return subject;
    }

    subject = new Subject(subjectId, this._id);

    this._subjectMap.set(subjectId, subject);

    this._updatedSubjs.add(subject);

    return subject;
  };

  public getSubject = (subjectId: string): Subject => {
    const subject = this._subjectMap.get(subjectId);

    if (!subject) {
      throw new Error('Subject not found: ' + subjectId);
    }

    return subject;
  };

  public getRoot = (): Subject => {
    return this.getSubject(this._id);
  };

  public deleteSubject = (subjectId: string) => {
    const subject = this.getSubject(subjectId);
    subject.isDeleted = true;
    this._updatedSubjs.add(subject);
  };

  public undeleteSubject = (subjectId: string) => {
    const subject = this.getSubject(subjectId);
    subject.isDeleted = false;
    this._updatedSubjs.add(subject);
  };

  public createPredicate = (predId: string): Predicate => {
    let predicate =
      this._predicateMap.get(predId) || new Predicate(predId, this._id);
    this._predicateMap.set(predId, predicate);
    return predicate;
  };

  public getPredicate = (predicateId: string): Predicate => {
    const predicate = this._predicateMap.get(predicateId);
    if (!predicate) {
      throw new Error('Predicate not found: ' + predicateId);
    }
    return predicate;
  };

  private _parseTurtle = (turtle: string) => {
    const parser = new n3.Parser({ baseIRI: this._id });
    const quads: any[] = parser.parse(turtle);
    quads.forEach(quad => {
      const subject =
        this._subjectMap.get(quad.subject.id) ||
        this.createSubject(quad.subject.id);

      const predicate =
        this._predicateMap.get(quad.predicate.id) ||
        this.createPredicate(quad.predicate.id);

      subject.fromQuad(predicate, quad.object);
    });
  };

  public getValue = (subjectId: string, predicateId: string): Literal => {
    const subject = this.getSubject(subjectId);
    const predicate = this.getPredicate(predicateId);
    return subject.getProperty(predicate);
  };

  public setValue = (
    subjectId: string,
    predicateId: string,
    value: Literal,
  ) => {
    const subject = this.getSubject(subjectId);
    const predicate = this.getPredicate(predicateId);
    subject.setProperty(predicate, value);
    this._updatedSubjs.add(subject);
  };

  public getSparqlForUpdate(): string {
    let sparql = '';
    for (let subject of this._updatedSubjs.values()) {
      sparql += subject.getSparqlForUpdate();
    }
    return sparql;
  }

  public commit() {
    for (let subject of this._updatedSubjs.values()) {
      subject.isDeleted
        ? this._subjectMap.delete(subject.id)
        : subject.commit();
    }
    this._updatedSubjs.clear();
  }

  public undo() {
    for (let subject of this._updatedSubjs.values()) {
      subject.isInserted ? this._subjectMap.delete(subject.id) : subject.undo();
    }
    this._updatedSubjs.clear();
  }
}

export { Graph };
