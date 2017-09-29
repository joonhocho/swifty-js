/* eslint no-unused-expressions: 0, max-statements: 0 */
import create from './index';

describe('Swift', () => {
  let Person;
  let p1;

  beforeAll(() => {
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
        toJSON: true,
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
        toJSON: (x) => String(x),
      },
      xTimes2: {
        onDidSet: ['x'],
        get() {
          return this.x * 2;
        },
        set(v) {
          this.x = v / 2;
        },
        toJSON: (x2) => ({x2}),
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
        toJSON: true,
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
        toJSON: (x) => x.getTime().toString(),
      },
      size: {
        equal: (a, b) => {
          return a && b &&
            a.w === b.w &&
            a.h === b.h;
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
    expect(Object.keys(p1).sort()).toEqual([
      'fNCopy',
      'inKeys',
      'lNCopy',
    ]);
  });


  it('sets default values', () => {
    expect(p1.x).toBe(1);
    expect(p1.xTimes2).toBe(2);
    expect(p1.inKeys).toBe('delta');
  });


  it('default values are overridable on init', () => {
    const p2 = new Person({x: 2, inKeys: null});
    expect(p2.x).toBe(2);
    expect(p2.xTimes2).toBe(4);
    expect(p2.inKeys).toBe(null);
  });


  it('default values can be overriden by assignment', () => {
    expect(p1.x).toBe(1);
    p1.x = 3;
    expect(p1.x).toBe(3);
  });


  it('get/set property', () => {
    expect(p1.x).toBe(1);
    expect(p1.xTimes2).toBe(2);

    p1.x = 2;
    expect(p1.x).toBe(2);
    expect(p1.xTimes2).toBe(4);

    p1.xTimes2 = 6;
    expect(p1.x).toBe(3);
    expect(p1.xTimes2).toBe(6);
  });


  it('read-only property', () => {
    expect(p1.readOnly).toBe(undefined);
    p1.readOnly = 3;
    expect(p1.readOnly).toBe(undefined);
  });


  it('read-only property set', () => {
    const p2 = new Person({readOnly: 2});
    expect(p2.readOnly).toBe(2);
    p2.readOnly = 3;
    expect(p2.readOnly).toBe(2);
  });


  it('simple method', () => {
    expect(p1.lastFirst()).toBe('L1, F1');
    p1.lN = 'L2';
    expect(p1.lastFirst()).toBe('L2, F1');
  });


  it('lazy values are not initialized until accessed', () => {
    expect(p1.hasOwnProperty('lazyName')).toBe(false);
    expect(p1.lazyName).toBe('F1 L1');
    expect(p1.hasOwnProperty('lazyName')).toBe(true);
  });


  it('lazy values can be overriden', () => {
    const p2 = new Person({lazyName: 'value'});
    expect(p2.hasOwnProperty('lazyName')).toBe(true);
    expect(p2.lazyName).toBe('value');
    p2.lazyName = 'new';
    expect(p2.lazyName).toBe('new');
  });


  it('basic property access', () => {
    expect(p1.fN).toBe('F1');
    expect(p1.lN).toBe('L1');
  });


  it('basic property access', () => {
    expect(p1.fN).toBe('F1');
    expect(p1.lN).toBe('L1');
  });


  it('computed property access', () => {
    expect(p1.name).toBe('F1 L1');

    p1.fN = 'F2';
    expect(p1.fN).toBe('F2');
    expect(p1.name).toBe('F2 L1');

    p1.lN = 'L2';
    expect(p1.lN).toBe('L2');
    expect(p1.name).toBe('F2 L2');
  });


  it('$willSet on basic property, fN', () => {
    const args = [];

    const off = p1.$willSet(['fN'], function(next) {
      expect(next).not.toBe(this.fN);
      args.push([this.fN, next]);
    });

    // $willSet not called for setting toBe value
    p1.fN = 'F1';
    expect(args.length).toBe(0);

    // called
    p1.fN = 'F2';
    expect(args).toEqual([['F1', 'F2']]);

    // not called
    p1.fN = 'F2';
    expect(args).toEqual([['F1', 'F2']]);

    // called
    p1.fN = 'F3';
    expect(args).toEqual([['F1', 'F2'], ['F2', 'F3']]);

    off();
    p1.fN = 'F4';
    expect(args).toEqual([['F1', 'F2'], ['F2', 'F3']]);

  });


  it('$willSet on basic property, lN', () => {
    const args = [];

    p1.$willSet(['lN'], function(next) {
      expect(next).not.toBe(this.lN);
      args.push([this.lN, next]);
    });

    // $willSet not called for setting toBe value
    p1.lN = 'L1';
    expect(args.length).toBe(0);

    // called
    p1.lN = 'L2';
    expect(args).toEqual([['L1', 'L2']]);

    // not called
    p1.lN = 'L2';
    expect(args).toEqual([['L1', 'L2']]);

    // called
    p1.lN = 'L3';
    expect(args).toEqual([['L1', 'L2'], ['L2', 'L3']]);
  });


  it('$didSet on basic property, fN', () => {
    const args = [];

    const off = p1.$didSet(['fN'], function(prev) {
      expect(prev).not.toBe(this.fN);
      args.push([prev, this.fN]);
    });

    // $didSet not called for setting toBe value
    p1.fN = 'F1';
    expect(args.length).toBe(0);

    // called
    p1.fN = 'F2';
    expect(args).toEqual([['F1', 'F2']]);

    // not called
    p1.fN = 'F2';
    expect(args).toEqual([['F1', 'F2']]);

    // called
    p1.fN = 'F3';
    expect(args).toEqual([['F1', 'F2'], ['F2', 'F3']]);

    off();
    p1.fN = 'F4';
    expect(args).toEqual([['F1', 'F2'], ['F2', 'F3']]);
  });


  it('$didSet on basic property, lN', () => {
    const args = [];

    p1.$didSet(['lN'], function(prev) {
      expect(prev).not.toBe(this.lN);
      args.push([prev, this.lN]);
    });

    // $didSet not called for setting toBe value
    p1.lN = 'L1';
    expect(args.length).toBe(0);

    // called
    p1.lN = 'L2';
    expect(args).toEqual([['L1', 'L2']]);

    // not called
    p1.lN = 'L2';
    expect(args).toEqual([['L1', 'L2']]);

    // called
    p1.lN = 'L3';
    expect(args).toEqual([['L1', 'L2'], ['L2', 'L3']]);
  });


  it('$willSet on computed property, fN -> name', () => {
    const args = [];

    p1.$willSet(['name'], function(next) {
      expect(next).not.toBe(this.name);
      args.push([this.name, next]);
    });

    // $willSet not called for setting toBe value
    p1.fN = 'F1';
    expect(args.length).toBe(0);

    // called
    p1.fN = 'F2';
    expect(args).toEqual([['F1 L1', 'F2 L1']]);

    // not called
    p1.fN = 'F2';
    expect(args).toEqual([['F1 L1', 'F2 L1']]);

    // called
    p1.fN = 'F3';
    expect(args).toEqual([['F1 L1', 'F2 L1'], ['F2 L1', 'F3 L1']]);
  });


  it('$didSet on computed property, fN -> name', () => {
    const args = [];

    p1.$didSet(['name'], function(prev) {
      expect(prev).not.toBe(this.name);
      args.push([prev, this.name]);
    });

    // $didSet not called for setting toBe value
    p1.fN = 'F1';
    expect(args.length).toBe(0);

    // called
    p1.fN = 'F2';
    expect(args).toEqual([['F1 L1', 'F2 L1']]);

    // not called
    p1.fN = 'F2';
    expect(args).toEqual([['F1 L1', 'F2 L1']]);

    // called
    p1.fN = 'F3';
    expect(args).toEqual([['F1 L1', 'F2 L1'], ['F2 L1', 'F3 L1']]);
  });


  it('$willSet on computed property, lN -> name', () => {
    const args = [];

    p1.$willSet(['name'], function(next) {
      expect(next).not.toBe(this.name);
      args.push([this.name, next]);
    });

    // $willSet not called for setting toBe value
    p1.lN = 'L1';
    expect(args.length).toBe(0);

    // called
    p1.lN = 'L2';
    expect(args).toEqual([['F1 L1', 'F1 L2']]);

    // not called
    p1.lN = 'L2';
    expect(args).toEqual([['F1 L1', 'F1 L2']]);

    // called
    p1.lN = 'L3';
    expect(args).toEqual([['F1 L1', 'F1 L2'], ['F1 L2', 'F1 L3']]);
  });


  it('$didSet on computed property, lN -> name', () => {
    const args = [];

    p1.$didSet(['name'], function(prev) {
      expect(this.name).not.toBe(prev);
      args.push([prev, this.name]);
    });

    // $didSet not called for setting toBe value
    p1.lN = 'L1';
    expect(args.length).toBe(0);

    // called
    p1.lN = 'L2';
    expect(args).toEqual([['F1 L1', 'F1 L2']]);

    // not called
    p1.lN = 'L2';
    expect(args).toEqual([['F1 L1', 'F1 L2']]);

    // called
    p1.lN = 'L3';
    expect(args).toEqual([['F1 L1', 'F1 L2'], ['F1 L2', 'F1 L3']]);
  });


  it('complex integer graph', () => {
    expect(p1.integer).toBe(undefined);

    p1.integer = 1;
    expect(p1.integer).toBe(1);

    p1.integer = 2;
    expect(p1.integer).toBe(2);

    p1.integer = 2;
    expect(p1.integer).toBe(2);

    p1.integer = 3;
    expect(p1.integer).toBe(3);

    p1.integer = 4.5;
    expect(p1.integer).toBe(4);

    p1.integer = 4.8;
    expect(p1.integer).toBe(4);

    p1.integer = 8.7;
    expect(p1.integer).toBe(8);

    p1.integer2 = 32;
    expect(p1.integer).toBe(16);
    expect(p1.integer2).toBe(32);
    expect(p1.integer4).toBe(64);
    expect(p1.integer8).toBe(128);

    p1.integer4 = 32;
    expect(p1.integer).toBe(8);
    expect(p1.integer2).toBe(16);
    expect(p1.integer4).toBe(32);
    expect(p1.integer8).toBe(64);

    p1.integer8 = 32;
    expect(p1.integer).toBe(4);
    expect(p1.integer2).toBe(8);
    expect(p1.integer4).toBe(16);
    expect(p1.integer8).toBe(32);

    p1.integer8 = 41;
    expect(p1.integer).toBe(5);
    expect(p1.integer2).toBe(10);
    expect(p1.integer4).toBe(20);
    expect(p1.integer8).toBe(40);

    p1.integer8 = 44;
    expect(p1.integer).toBe(5);
    expect(p1.integer2).toBe(10);
    expect(p1.integer4).toBe(20);
    expect(p1.integer8).toBe(44);

    p1.integer = 6;
    expect(p1.integer).toBe(6);
    expect(p1.integer2).toBe(12);
    expect(p1.integer4).toBe(24);
    expect(p1.integer8).toBe(48);
  });


  it('commit at once for slow props', () => {
    p1.$commitEnabled = false;

    const sums = [];
    p1.$didSet('slowSum', function() {
      sums.push(this.slowSum);
    });

    expect(p1.slowSum).toBe(3);

    p1.add1 = 10;
    expect(p1.add1).toBe(10);
    expect(p1.slowSum).toBe(3);
    expect(sums.length).toBe(0);

    p1.add2 = 7;
    expect(p1.add2).toBe(7);
    expect(p1.slowSum).toBe(3);
    expect(sums.length).toBe(0);

    p1.add2 = 11;
    expect(p1.add2).toBe(11);
    expect(p1.slowSum).toBe(3);
    expect(sums.length).toBe(0);

    p1.$commitEnabled = true;
    p1.$commit();

    expect(p1.slowSum).toBe(21);
    expect(sums).toEqual([21]);
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

    expect(p1.slowSum).toBe(3);

    p1.$set({
      add1: 10,
      add2: 11,
    });

    expect(p1.add1).toBe(10);
    expect(p1.add2).toBe(11);
    expect(p1.slowSum).toBe(21);
    expect(sums).toEqual([21]);
    expect(args).toEqual([{
      add1: 1,
      add2: 2,
    }, {
      add1: 10,
      add2: 11,
    }, 10, 11]);
  });


  it('parse sanitizes set value. format formats get value', () => {
    const p2 = new Person({bool: 3});
    expect(p2.bool).toBe('T');
    expect(p1.bool).toBe('F');
    // expect(p1.hasOwnProperty('bool')).toBe(true);
    p1.bool = 1;
    p2.bool = '';
    expect(p1.bool).toBe('T');
    expect(p2.bool).toBe('F');
    p1.bool = 0;
    expect(p1.bool).toBe('F');
    p1.bool = {};
    expect(p1.bool).toBe('T');
    p1.bool = null;
    expect(p1.bool).toBe('F');
    p1.bool = true;
    expect(p1.bool).toBe('T');
    p1.bool = NaN;
    expect(p1.bool).toBe('F');
    p1.bool = undefined;
    expect(p1.bool).toBe('F');
  });


  it('parse sanitizes set value. format formats get value. for get/set', () => {
    expect(p1.date.getTime()).toBeNaN();
    expect(p1.date instanceof Date).toBe(true);
    expect(p1._timestamp).toBeNaN();

    p1.date = 0;
    expect(p1.date.getTime()).toBe(0);
    expect(p1.date instanceof Date).toBe(true);
    expect(p1._timestamp).toBe(0);

    p1.date = '1999-11-11';
    expect(p1.date.getUTCFullYear()).toBe(1999);
    expect(p1.date.getUTCMonth()).toBe(10);
    expect(p1.date.getUTCDate()).toBe(11);
    expect(p1.date instanceof Date).toBe(true);
    expect(p1._timestamp).toBe(942278400000);
  });


  it('basic toJSON', () => {
    p1.date = 1000;
    expect(p1.toJSON()).toEqual({
      bool: 'F',
      date: '1000',
      name: 'F1 L1',
      x: '1',
      xTimes2: {
        x2: 2,
      },
    });

    p1.x = 4;
    p1.bool = true;
    p1.fN = 'F2';
    expect(p1.toJSON()).toEqual({
      bool: 'T',
      date: '1000',
      name: 'F2 L1',
      x: '4',
      xTimes2: {
        x2: 8,
      },
    });
  });


  it('custom toJSON', () => {
    const C = create({
      x: {
        toJSON: true,
      },
      z: {
      },
      toJSON(o) {
        if (o.x == null) {
          delete o.x;
        }
        return Object.assign(o, this);
      },
    });
    const c1 = new C();

    expect(c1.toJSON()).toEqual({});
    c1.x = 3;
    expect(c1.toJSON()).toEqual({x: 3});
    c1.x = null;
    expect(c1.toJSON()).toEqual({});
    c1.z = 2;
    c1.y = 3;
    expect(c1.toJSON()).toEqual({y: 3});
  });


  it('$didChange is called after any changes', () => {
    const args = [];
    const off = p1.$didChange(function(initial, changed) {
      args.push(changed, this);
    });

    p1.x = 3;
    expect(args).toEqual([{
      xTimes2: 6,
    }, p1,
    {
      x: 3,
    }, p1]);

    args.length = 0;
    off();

    p1.x = 2;
    expect(args).toEqual([]);
  });


  it('$didChangeAsync is called asyncly after any changes', (done) => {
    const args = [];
    const off = p1.$didChangeAsync(function(initial, changed) {
      args.push(changed, this);
    });

    p1.x = 3;

    setTimeout(() => {
      expect(args).toEqual([{
        x: 3,
        xTimes2: 6,
      }, p1]);

      args.length = 0;

      off();
      p1.x = 2;
      setTimeout(() => {
        expect(args).toEqual([]);
        done();
      }, 30);
    }, 30);
  });

  it('equal is used as a field comparator', () => {
    let sizes = [];

    p1.$willSet('size', function(newSize) {
      sizes.push(newSize);
    });

    p1.size = {w: 100, h: 50};

    expect(sizes).toEqual([{w: 100, h: 50}]);

    p1.size = {w: 100, h: 50};
    expect(sizes).toEqual([{w: 100, h: 50}]);

    p1.size = {w: 101, h: 50};
    expect(sizes).toEqual([{w: 100, h: 50}, {w: 101, h: 50}]);

    p1.size = {w: 101, h: 50};
    expect(sizes).toEqual([{w: 100, h: 50}, {w: 101, h: 50}]);
  });

  it('test $revision', () => {
    const Simple = create({
      bool: {
        parse: Boolean,
      },
    });

    const s1 = new Simple({});

    expect(s1.$revision).toBe(0);
    expect(s1.$revision).toBe(0);

    s1.bool = 1;
    expect(s1.$revision).toBe(1);

    s1.bool = true;
    expect(s1.$revision).toBe(1);

    s1.bool = 0;
    expect(s1.$revision).toBe(2);

    s1.bool = false;
    expect(s1.$revision).toBe(2);

    s1.bool = 3;
    expect(s1.$revision).toBe(3);

    s1.bool = {};
    expect(s1.$revision).toBe(3);
  });
});
