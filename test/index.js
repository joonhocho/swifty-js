/* eslint no-unused-expressions: 0, max-statements: 0 */
import {expect} from 'chai';
import create from '../src';

describe('Swift', () => {
  let Person;
  let p1;

  before(() => {
    Person = create({
      fN: {
        willSet(newValue) {
          this.fNCopy = newValue;
        },
      },
      lN: {
        didSet(prevValue) {
          this.lNCopy = this.lN;
        },
      },
      name: {
        onDidSet: ['fN', 'lN'],
        get() {
          return `${this.fN} ${this.lN}`;
        },
      },
      lazyName: {
        lazy() {
          return `${this.fN} ${this.lN}`;
        },
        // willSet or didSet cannot be used together on lazy property
      },
      readOnly: {
        writable: false,
        // willSet or didSet cannot be used together on lazy property
      },
      x: {
        value: 1,
      },
      xTimes2: {
        onDidSet: ['x'],
        get() {
          return this.x * 2;
        },
        set(v) {
          this.x = v / 2;
        },
      },
      integer: {
        willSet(v) {
          this.integer = Math.floor(v);
        },
      },
      integer2: {
        onDidSet: ['integer'],
        get() {
          return this.integer * 2;
        },
        set(v) {
          this.integer = v / 2;
        },
      },
      integer4: {
        onDidSet: ['integer2'],
        get() {
          return this.integer2 * 2;
        },
        willSet(v) {
          this.integer = v / 4;
          this.integer2 = v / 2;
          this.integer8 = v * 2;
        },
        didSet() {
          this.integer = this.integer4 / 4;
          this.integer2 = this.integer4 / 2;
          this.integer8 = this.integer4 * 2;
        },
      },
      integer8: {
        willSet(x) {
          this.integer = x / 8;
        },
        didSet() {
          this.integer = this.integer8 / 8;
        },
      },
      inKeys: {
        value: 'delta',
        enumerable: true,
      },
      lastFirst() {
        return `${this.lNCopy}, ${this.fNCopy}`;
      },
      add1: {
        value: 1,
      },
      add2: {
        value: 2,
      },
      slowSum: {
        onDidSet: ['add1', 'add2'],
        get() {
          return this.add1 + this.add2;
        },
      },
      bool: {
        parse(v) {
          return Boolean(v);
        },
        format(v) {
          return v ? 'T' : 'F';
        },
      },
      date: {
        get() {
          return this._timestamp;
        },
        set(x) {
          this._timestamp = x;
        },
        parse(v) {
          return new Date(v).getTime();
        },
        format(v) {
          return new Date(v);
        },
      },
    });
  });


  beforeEach(() => {
    p1 = new Person({
      fN: 'F1',
      lN: 'L1',
    });
  });


  it('get keys', () => {
    expect(Object.keys(p1).sort()).to.eql([
      'fNCopy',
      'inKeys',
      'lNCopy',
    ]);
  });


  it('sets default values', () => {
    expect(p1.x).to.equal(1);
    expect(p1.xTimes2).to.equal(2);
    expect(p1.inKeys).to.equal('delta');
  });


  it('default values are overridable on init', () => {
    const p2 = new Person({x: 2, inKeys: null});
    expect(p2.x).to.equal(2);
    expect(p2.xTimes2).to.equal(4);
    expect(p2.inKeys).to.equal(null);
  });


  it('default values can be overriden by assignment', () => {
    expect(p1.x).to.equal(1);
    p1.x = 3;
    expect(p1.x).to.equal(3);
  });


  it('get/set property', () => {
    expect(p1.x).to.equal(1);
    expect(p1.xTimes2).to.equal(2);

    p1.x = 2;
    expect(p1.x).to.equal(2);
    expect(p1.xTimes2).to.equal(4);

    p1.xTimes2 = 6;
    expect(p1.x).to.equal(3);
    expect(p1.xTimes2).to.equal(6);
  });


  it('read-only property', () => {
    expect(p1.readOnly).to.equal(undefined);
    p1.readOnly = 3;
    expect(p1.readOnly).to.equal(undefined);
  });


  it('read-only property set', () => {
    const p2 = new Person({readOnly: 2});
    expect(p2.readOnly).to.equal(2);
    p2.readOnly = 3;
    expect(p2.readOnly).to.equal(2);
  });


  it('simple method', () => {
    expect(p1.lastFirst()).to.equal('L1, F1');
    p1.lN = 'L2';
    expect(p1.lastFirst()).to.equal('L2, F1');
  });


  it('lazy values are not initialized until accessed', () => {
    expect(p1.hasOwnProperty('lazyName')).to.be.false;
    expect(p1.lazyName).to.equal('F1 L1');
    expect(p1.hasOwnProperty('lazyName')).to.be.true;
  });


  it('lazy values can be overriden', () => {
    const p2 = new Person({lazyName: 'value'});
    expect(p2.hasOwnProperty('lazyName')).to.be.true;
    expect(p2.lazyName).to.equal('value');
    p2.lazyName = 'new';
    expect(p2.lazyName).to.equal('new');
  });


  it('basic property access', () => {
    expect(p1.fN).to.equal('F1');
    expect(p1.lN).to.equal('L1');
  });


  it('basic property access', () => {
    expect(p1.fN).to.equal('F1');
    expect(p1.lN).to.equal('L1');
  });


  it('computed property access', () => {
    expect(p1.name).to.equal('F1 L1');

    p1.fN = 'F2';
    expect(p1.fN).to.equal('F2');
    expect(p1.name).to.equal('F2 L1');

    p1.lN = 'L2';
    expect(p1.lN).to.equal('L2');
    expect(p1.name).to.equal('F2 L2');
  });


  it('$willSet on basic property, fN', () => {
    const args = [];

    p1.$willSet(['fN'], function(next) {
      expect(next).to.not.equal(this.fN);
      args.push([this.fN, next]);
    });

    // $willSet not called for setting to equal value
    p1.fN = 'F1';
    expect(args.length).to.equal(0);

    // called
    p1.fN = 'F2';
    expect(args).to.eql([['F1', 'F2']]);

    // not called
    p1.fN = 'F2';
    expect(args).to.eql([['F1', 'F2']]);

    // called
    p1.fN = 'F3';
    expect(args).to.eql([['F1', 'F2'], ['F2', 'F3']]);
  });


  it('$willSet on basic property, lN', () => {
    const args = [];

    p1.$willSet(['lN'], function(next) {
      expect(next).to.not.equal(this.lN);
      args.push([this.lN, next]);
    });

    // $willSet not called for setting to equal value
    p1.lN = 'L1';
    expect(args.length).to.equal(0);

    // called
    p1.lN = 'L2';
    expect(args).to.eql([['L1', 'L2']]);

    // not called
    p1.lN = 'L2';
    expect(args).to.eql([['L1', 'L2']]);

    // called
    p1.lN = 'L3';
    expect(args).to.eql([['L1', 'L2'], ['L2', 'L3']]);
  });


  it('$didSet on basic property, fN', () => {
    const args = [];

    p1.$didSet(['fN'], function(prev) {
      expect(prev).to.not.equal(this.fN);
      args.push([prev, this.fN]);
    });

    // $didSet not called for setting to equal value
    p1.fN = 'F1';
    expect(args.length).to.equal(0);

    // called
    p1.fN = 'F2';
    expect(args).to.eql([['F1', 'F2']]);

    // not called
    p1.fN = 'F2';
    expect(args).to.eql([['F1', 'F2']]);

    // called
    p1.fN = 'F3';
    expect(args).to.eql([['F1', 'F2'], ['F2', 'F3']]);
  });


  it('$didSet on basic property, lN', () => {
    const args = [];

    p1.$didSet(['lN'], function(prev) {
      expect(prev).to.not.equal(this.lN);
      args.push([prev, this.lN]);
    });

    // $didSet not called for setting to equal value
    p1.lN = 'L1';
    expect(args.length).to.equal(0);

    // called
    p1.lN = 'L2';
    expect(args).to.eql([['L1', 'L2']]);

    // not called
    p1.lN = 'L2';
    expect(args).to.eql([['L1', 'L2']]);

    // called
    p1.lN = 'L3';
    expect(args).to.eql([['L1', 'L2'], ['L2', 'L3']]);
  });


  it('$willSet on computed property, fN -> name', () => {
    const args = [];

    p1.$willSet(['name'], function(next) {
      expect(next).to.not.equal(this.name);
      args.push([this.name, next]);
    });

    // $willSet not called for setting to equal value
    p1.fN = 'F1';
    expect(args.length).to.equal(0);

    // called
    p1.fN = 'F2';
    expect(args).to.eql([['F1 L1', 'F2 L1']]);

    // not called
    p1.fN = 'F2';
    expect(args).to.eql([['F1 L1', 'F2 L1']]);

    // called
    p1.fN = 'F3';
    expect(args).to.eql([['F1 L1', 'F2 L1'], ['F2 L1', 'F3 L1']]);
  });


  it('$didSet on computed property, fN -> name', () => {
    const args = [];

    p1.$didSet(['name'], function(prev) {
      expect(prev).to.not.equal(this.name);
      args.push([prev, this.name]);
    });

    // $didSet not called for setting to equal value
    p1.fN = 'F1';
    expect(args.length).to.equal(0);

    // called
    p1.fN = 'F2';
    expect(args).to.eql([['F1 L1', 'F2 L1']]);

    // not called
    p1.fN = 'F2';
    expect(args).to.eql([['F1 L1', 'F2 L1']]);

    // called
    p1.fN = 'F3';
    expect(args).to.eql([['F1 L1', 'F2 L1'], ['F2 L1', 'F3 L1']]);
  });


  it('$willSet on computed property, lN -> name', () => {
    const args = [];

    p1.$willSet(['name'], function(next) {
      expect(next).to.not.equal(this.name);
      args.push([this.name, next]);
    });

    // $willSet not called for setting to equal value
    p1.lN = 'L1';
    expect(args.length).to.equal(0);

    // called
    p1.lN = 'L2';
    expect(args).to.eql([['F1 L1', 'F1 L2']]);

    // not called
    p1.lN = 'L2';
    expect(args).to.eql([['F1 L1', 'F1 L2']]);

    // called
    p1.lN = 'L3';
    expect(args).to.eql([['F1 L1', 'F1 L2'], ['F1 L2', 'F1 L3']]);
  });


  it('$didSet on computed property, lN -> name', () => {
    const args = [];

    p1.$didSet(['name'], function(prev) {
      expect(this.name).to.not.equal(prev);
      args.push([prev, this.name]);
    });

    // $didSet not called for setting to equal value
    p1.lN = 'L1';
    expect(args.length).to.equal(0);

    // called
    p1.lN = 'L2';
    expect(args).to.eql([['F1 L1', 'F1 L2']]);

    // not called
    p1.lN = 'L2';
    expect(args).to.eql([['F1 L1', 'F1 L2']]);

    // called
    p1.lN = 'L3';
    expect(args).to.eql([['F1 L1', 'F1 L2'], ['F1 L2', 'F1 L3']]);
  });


  it('complex integer graph', () => {
    expect(p1.integer).to.equal(undefined);

    p1.integer = 1;
    expect(p1.integer).to.equal(1);

    p1.integer = 2;
    expect(p1.integer).to.equal(2);

    p1.integer = 2;
    expect(p1.integer).to.equal(2);

    p1.integer = 3;
    expect(p1.integer).to.equal(3);

    p1.integer = 4.5;
    expect(p1.integer).to.equal(4);

    p1.integer = 4.8;
    expect(p1.integer).to.equal(4);

    p1.integer = 8.7;
    expect(p1.integer).to.equal(8);

    p1.integer2 = 32;
    expect(p1.integer).to.equal(16);
    expect(p1.integer2).to.equal(32);
    expect(p1.integer4).to.equal(64);
    expect(p1.integer8).to.equal(128);

    p1.integer4 = 32;
    expect(p1.integer).to.equal(8);
    expect(p1.integer2).to.equal(16);
    expect(p1.integer4).to.equal(32);
    expect(p1.integer8).to.equal(64);

    p1.integer8 = 32;
    expect(p1.integer).to.equal(4);
    expect(p1.integer2).to.equal(8);
    expect(p1.integer4).to.equal(16);
    expect(p1.integer8).to.equal(32);

    p1.integer8 = 41;
    expect(p1.integer).to.equal(5);
    expect(p1.integer2).to.equal(10);
    expect(p1.integer4).to.equal(20);
    expect(p1.integer8).to.equal(40);

    p1.integer8 = 44;
    expect(p1.integer).to.equal(5);
    expect(p1.integer2).to.equal(10);
    expect(p1.integer4).to.equal(20);
    expect(p1.integer8).to.equal(44);

    p1.integer = 6;
    expect(p1.integer).to.equal(6);
    expect(p1.integer2).to.equal(12);
    expect(p1.integer4).to.equal(24);
    expect(p1.integer8).to.equal(48);
  });


  it('commit at once for slow props', () => {
    p1.$commitEnabled = false;

    const sums = [];
    p1.$didSet('slowSum', function() {
      sums.push(this.slowSum);
    });

    expect(p1.slowSum).to.equal(3);

    p1.add1 = 10;
    expect(p1.add1).to.equal(10);
    expect(p1.slowSum).to.equal(3);
    expect(sums.length).to.equal(0);

    p1.add2 = 7;
    expect(p1.add2).to.equal(7);
    expect(p1.slowSum).to.equal(3);
    expect(sums.length).to.equal(0);

    p1.add2 = 11;
    expect(p1.add2).to.equal(11);
    expect(p1.slowSum).to.equal(3);
    expect(sums.length).to.equal(0);

    p1.$commitEnabled = true;
    p1.$commit();

    expect(p1.slowSum).to.equal(21);
    expect(sums).to.eql([21]);
  });


  it('$set sets multiple values at once', () => {
    const sums = [];
    p1.$didSet('slowSum', function() {
      sums.push(this.slowSum);
    });

    const args = [];
    p1.$didSet(['add1', 'add2'], function(add1, add2) {
      args.push(add1, add2, this.add1, this.add2);
    });

    expect(p1.slowSum).to.equal(3);

    p1.$set({
      add1: 10,
      add2: 11,
    });

    expect(p1.add1).to.equal(10);
    expect(p1.add2).to.equal(11);
    expect(p1.slowSum).to.equal(21);
    expect(sums).to.eql([21]);
    expect(args).to.eql([1, 2, 10, 11]);
  });


  it('parse sanitizes set value. format formats get value', () => {
    const p2 = new Person({bool: 3});
    expect(p2.bool).to.equal('T');
    expect(p1.bool).to.equal('F');
    // expect(p1.hasOwnProperty('bool')).to.equal(true);
    p1.bool = 1;
    p2.bool = '';
    expect(p1.bool).to.equal('T');
    expect(p2.bool).to.equal('F');
    p1.bool = 0;
    expect(p1.bool).to.equal('F');
    p1.bool = {};
    expect(p1.bool).to.equal('T');
    p1.bool = null;
    expect(p1.bool).to.equal('F');
    p1.bool = true;
    expect(p1.bool).to.equal('T');
    p1.bool = NaN;
    expect(p1.bool).to.equal('F');
    p1.bool = undefined;
    expect(p1.bool).to.equal('F');
  });


  it('parse sanitizes set value. format formats get value. for get/set', () => {
    expect(p1.date.getTime()).to.be.NaN;
    expect(p1.date instanceof Date).to.equal(true);
    expect(p1._timestamp).to.be.NaN;

    p1.date = 0;
    expect(p1.date.getTime()).to.equal(0);
    expect(p1.date instanceof Date).to.equal(true);
    expect(p1._timestamp).to.equal(0);

    p1.date = '1999-11-11';
    expect(p1.date.getUTCFullYear()).to.equal(1999);
    expect(p1.date.getUTCMonth()).to.equal(10);
    expect(p1.date.getUTCDate()).to.equal(11);
    expect(p1.date instanceof Date).to.equal(true);
    expect(p1._timestamp).to.equal(942278400000);
  });
});
