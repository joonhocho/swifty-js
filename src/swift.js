/* eslint max-len: 0, no-continue: 0, no-underscore-dangle: 0, no-use-before-define: 0, max-params: 0, max-statements: 0, no-return-assign: 0 */
import {
  isPlainObject,
  isFunction,
  arrayRemove,
  arrayIndexOfNaN,
  defineProperty,
  defineHiddenConstant,
  defineHiddenConstants,
  defineHiddenProperty,
} from './util';


const $initDesc = {
  value: true,
  enumerable: false,
  writable: true,
  configurable: false,
};


const createSetHandler = (index, fn, keys) => function(val) {
  const args = [];
  for (let i = 0, il = keys.length; i < il; i++) {
    args.push(i === index ? val : this[keys[i]]);
  }
  fn.apply(this, args);
};


const define$willSet = (mapKey, offKey) => function(keys, fn) {
  const map = this[mapKey];
  if (typeof keys === 'string' || keys.length === 1) {
    const key = typeof keys === 'string' ? keys : keys[0];
    (map[key] || (map[key] = [])).push(fn);
    return () => this[offKey](key, fn);
  }

  const fns = keys.map((key, i) => {
    const newFn = createSetHandler(i, fn, keys);
    (map[key] || (map[key] = [])).push(newFn);
    return newFn;
  });

  return () => {
    for (let i = 0, il = keys.length; i < il; i++) {
      this[offKey](keys[i], fns[i]);
    }
  };
};


const define$offWillSet = (mapKey) => function(key, fn) {
  const list = this[mapKey][key];
  return list ? arrayRemove(list, fn) : false;
};


const define$willSetMap = (mapKey) => function() {
  const val = Object.create(null);
  defineHiddenConstant(this, mapKey, val);
  return val;
};


const $$init = '$$init';
const $$willSetMap = '$$willSetMap';
const $$didSetMap = '$$didSetMap';
const $$enumerables = '$$enumerables';
const $$onDidSet = '$$onDidSet';
const $$defaultKeys = '$$defaultKeys';

const $willSet = define$willSet($$willSetMap, '$offWillSet');
const $didSet = define$willSet($$didSetMap, '$offDidSet');
const $offWillSet = define$offWillSet($$willSetMap);
const $offDidSet = define$offWillSet($$didSetMap);
const $$willSetMapGetter = define$willSetMap($$willSetMap);
const $$didSetMapGetter = define$willSetMap($$didSetMap);


const computeSetter = (key, get) => function() {
  this[key] = get.call(this);
};

const $keyGetter = ($key) => function() {
  // unintialized for this instance
  return this[$key] = undefined;
};

const $keySetter = ($key) => function(val) {
  // intialize for this instance
  defineHiddenProperty(this, $key, val);
};

const $queueGetter = ($queue) => function() {
  // unintialized for this instance
  return this[$queue] = [];
};

const $queueSetter = ($queue) => function(val) {
  // intialize for this instance
  defineHiddenProperty(this, $queue, val);
};

const observablePropGetterWithGetter = (key, $key, get) => function() {
  if (this.hasOwnProperty($key)) {
    return this[$key];
  }
  return this[key] = get.call(this);
};

const observablePropGetterWithDefaultValue = (key, $key, value) => function() {
  if (this.hasOwnProperty($key)) {
    return this[$key];
  }
  return this[key] = value;
};

const simpleGetter = ($key) => function() {
  return this[$key];
};

const readOnlyPropSetter = ($key) => function(val) {
  if (this[$$init]) {
    this[$key] = val;
  }
};

const observablePropSetter = (key, $key, $queue, hasSet, set, hasWillSet, willSet, hasDidSet, didSet) => function(newValue) {
  const queue = this[$queue];
  if (arrayIndexOfNaN(queue, newValue) >= 0) {
    // already setting this value in the stack
    // avoid infinite loop
    return;
  }

  queue.push(newValue);
  if (queue.length > 1) {
    // not initial set
    // simply push to queue and return
    return;
  }

  for (let i = 0; i < queue.length; i++) {
    const nextVal = queue[i];
    const val = this[$key];

    if (nextVal === val) continue;

    if (hasWillSet) {
      willSet.call(this, nextVal, val);
    }

    const willSets = this[$$willSetMap][key];
    if (willSets != null && willSets.length > 0) {
      const list = willSets.slice();
      for (let j = 0, jl = list.length; j < jl; j++) {
        list[j].call(this, nextVal, val);
      }
    }

    if (hasSet) {
      set.call(this, nextVal, val);
    }

    this[$key] = nextVal;

    if (hasDidSet) {
      didSet.call(this, val, nextVal);
    }

    const $on = this[$$onDidSet][key];
    if ($on != null) {
      for (let j = 0, jl = $on.length; j < jl; j++) {
        $on[j].call(this);
      }
    }

    const didSets = this[$$didSetMap][key];
    if (didSets != null && didSets.length > 0) {
      const list = didSets.slice();
      for (let j = 0, jl = list.length; j < jl; j++) {
        list[j].call(this, val, nextVal);
      }
    }
  }

  queue.length = 0;
};


const createNewClass = () => class Class {
  constructor(data) {
    defineProperty(this, $$init, $initDesc);

    const $$enums = this[$$enumerables];
    if ($$enums) {
      Object.defineProperties(this, $$enums);
    }

    const defaultKeys = this[$$defaultKeys];
    if (defaultKeys.length > 0) {
      for (let i = 0, il = defaultKeys.length; i < il; i++) {
        const key = defaultKeys[i];
        if (!(key in data)) {
          this[key] = this[key];
        }
      }
    }

    Object.assign(this, data);

    this[$$init] = false;
  }
};


const create = (props) => {
  const propKeys = Object.getOwnPropertyNames(props);

  const Class = createNewClass();

  const {prototype} = Class;

  prototype[$$enumerables] = Object.create(null);

  defineHiddenConstants(prototype, {
    [$$defaultKeys]: [],
    [$$onDidSet]: Object.create(null),
    $willSet,
    $didSet,
    $offWillSet,
    $offDidSet,
  });

  defineProperty(prototype, $$willSetMap, {
    get: $$willSetMapGetter,
    enumerable: false,
    configurable: false,
  });

  defineProperty(prototype, $$didSetMap, {
    get: $$didSetMapGetter,
    enumerable: false,
    configurable: false,
  });

  for (let i = 0, il = propKeys.length; i < il; i++) {
    const key = propKeys[i];

    const {
      get,
      set,
      value,
      // writable,
      // enumerable,
      // configurable,
    } = Object.getOwnPropertyDescriptor(props, key);

    let desc;
    if (get || set) {
      // getter / setter
      desc = {
        get,
        set,
      };
    } else if (isFunction(value)) {
      // method
      desc = {
        method: value,
      };
    } else if (isPlainObject(value)) {
      desc = {
        ...value,
      };
    } else {
      // default value
      desc = {
        value,
      };
    }

    defineProp(Class, key, desc);
  }

  if (Object.keys(prototype[$$enumerables]).length > 0) {
    defineHiddenConstant(prototype, $$enumerables, prototype[$$enumerables]);
  } else {
    defineHiddenConstant(prototype, $$enumerables, null);
  }

  return Class;
};


const assertUndefined = (key, value, propType, propKey) => {
  if (value !== undefined) {
    throw new Error(`'${key}' cannot be defined on ${propType} property, '${propKey}'`);
  }
};


const defineMethod = (Class, key, {
  onDidSet,
  get,
  set,
  willSet,
  didSet,
  lazy,
  method,
  value,
  writable,
  enumerable,
}) => {
  assertUndefined('onDidSet', onDidSet, 'method', key);
  assertUndefined('get', get, 'method', key);
  assertUndefined('set', set, 'method', key);
  assertUndefined('willSet', willSet, 'method', key);
  assertUndefined('didSet', didSet, 'method', key);
  assertUndefined('lazy', lazy, 'method', key);
  assertUndefined('value', value, 'method', key);
  assertUndefined('writable', writable, 'method', key);
  assertUndefined('enumerable', enumerable, 'method', key);

  defineHiddenConstant(Class.prototype, key, method);
};


const defineLazyProperty = (Class, key, {
  onDidSet,
  get,
  set,
  willSet,
  didSet,
  lazy,
  method,
  value,
  writable = true,
  enumerable = false,
}) => {
  assertUndefined('onDidSet', onDidSet, 'lazy', key);
  assertUndefined('get', get, 'lazy', key);
  assertUndefined('set', set, 'lazy', key);
  assertUndefined('willSet', willSet, 'lazy', key);
  assertUndefined('didSet', didSet, 'lazy', key);
  assertUndefined('method', method, 'lazy', key);
  assertUndefined('value', value, 'lazy', key);

  const desc = {
    get() {
      const val = lazy.call(this);
      defineProperty(this, key, {
        value: val,
        writable,
        enumerable,
        configurable: true,
      });
      return val;
    },
    set: writable ? function(val) {
      defineProperty(this, key, {
        value: val,
        writable,
        enumerable,
        configurable: true,
      });
    } : undefined,
    enumerable,
    configurable: false,
  };

  if (enumerable) {
    Class.prototype[$$enumerables][key] = desc;
  }

  defineProperty(Class.prototype, key, desc);
};


const defineGetSetProperty = (Class, key, {
  onDidSet,
  get,
  set,
  willSet,
  didSet,
  lazy,
  method,
  value,
  writable,
  enumerable = false,
}) => {
  assertUndefined('lazy', lazy, 'get/set', key);
  assertUndefined('method', method, 'get/set', key);
  assertUndefined('value', value, 'get/set', key);
  assertUndefined('writable', writable, 'get/set', key);

  const $key = `$${key}`;
  const $queue = `$${key}$Q`;

  const hasSet = isFunction(set);
  const hasWillSet = isFunction(willSet);
  const hasDidSet = isFunction(didSet);

  if (onDidSet != null && onDidSet.length > 0) {
    for (let i = 0, il = onDidSet.length; i < il; i++) {
      const on = onDidSet[i];
      const map = Class.prototype[$$onDidSet];
      (map[on] || (map[on] = [])).push(computeSetter(key, get));
    }
  }

  defineProperty(Class.prototype, $key, {
    get: $keyGetter($key),
    set: $keySetter($key),
    enumerable: false,
    configurable: false,
  });

  defineProperty(Class.prototype, $queue, {
    get: $queueGetter($queue),
    set: $queueSetter($queue),
    enumerable: false,
    configurable: false,
  });

  const desc = {
    get: isFunction(get) ?
      observablePropGetterWithGetter(key, $key, get) :
      simpleGetter($key),
    set: observablePropSetter(key, $key, $queue, hasSet, set, hasWillSet, willSet, hasDidSet, didSet),
    enumerable,
    configurable: false,
  };

  if (enumerable) {
    Class.prototype[$$enumerables][key] = desc;
  }

  defineProperty(Class.prototype, key, desc);
};


const defineValueProperty = (Class, key, {
  onDidSet,
  get,
  set,
  willSet,
  didSet,
  lazy,
  method,
  value,
  writable = true,
  enumerable = false,
}) => {
  assertUndefined('onDidSet', onDidSet, 'value', key);
  assertUndefined('get', get, 'value', key);
  assertUndefined('set', set, 'value', key);
  assertUndefined('lazy', lazy, 'value', key);
  assertUndefined('method', method, 'value', key);

  const hasDefaultValue = value !== undefined;
  if (hasDefaultValue) {
    Class.prototype[$$defaultKeys].push(key);
  }

  const hasWillSet = isFunction(willSet);
  const hasDidSet = isFunction(didSet);

  const $key = `$${key}`;
  const $queue = `$${key}$Q`;

  defineProperty(Class.prototype, $key, {
    get: $keyGetter($key),
    set: $keySetter($key),
    enumerable: false,
    configurable: false,
  });

  defineProperty(Class.prototype, $queue, {
    get: $queueGetter($queue),
    set: $queueSetter($queue),
    enumerable: false,
    configurable: false,
  });

  const desc = {
    get: hasDefaultValue ?
      observablePropGetterWithDefaultValue(key, $key, value) :
      simpleGetter($key),
    set: writable ?
      observablePropSetter(key, $key, $queue, false, set, hasWillSet, willSet, hasDidSet, didSet) :
      readOnlyPropSetter($key),
    enumerable,
    configurable: false,
  };

  if (enumerable) {
    Class.prototype[$$enumerables][key] = desc;
  }

  defineProperty(Class.prototype, key, desc);
};


const defineProp = (Class, key, desc) => {
  const {
    get,
    set,
    lazy,
    method,
  } = desc;

  if (method) {
    return defineMethod(Class, key, desc);
  }

  if (lazy) {
    return defineLazyProperty(Class, key, desc);
  }

  if (get || set) {
    return defineGetSetProperty(Class, key, desc);
  }

  return defineValueProperty(Class, key, desc);
};


export default create;
