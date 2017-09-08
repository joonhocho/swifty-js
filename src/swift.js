/* eslint max-len: 0, no-continue: 0, no-underscore-dangle: 0, no-use-before-define: 0, max-params: 0, max-statements: 0, no-return-assign: 0, no-confusing-arrow: 0, no-extra-parens: 0 */
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


const $$init = '$$init';
const $$willSetMap = '$$willSetMap';
const $$propDidSet = '$$propDidSet';
const $$didSetMap = '$$didSetMap';
const $$didSetManyMap = '$$didSetManyMap';
const $$onDidSet = '$$onDidSet';
const $$onDidSetMany = '$$onDidSetMany';
const $$enumerables = '$$enumerables';
const $$defaultKeys = '$$defaultKeys';
const $$initial = '$$initial';
const $$pending = '$$pending';
const $$updating = '$$updating';
const $commitEnabled = '$commitEnabled';
const $$fnIdKey = '$$ID';
const $$fnKeys = '$$KEYS';

const create$key = (key) => `K$${key}`;
const create$queue = (key) => `Q$${key}`;

let nextFnId = 1;

const define$willSet = (mapKey, manyMapKey) => function(keys, fn) {
  if (typeof keys === 'string' || keys.length === 1) {
    const map = this[mapKey];
    const key = typeof keys === 'string' ? keys : keys[0];
    (map[key] || (map[key] = [])).push(fn);
    return () => arrayRemove(map[key], fn);
  }

  if (manyMapKey) {
    const map = this[manyMapKey];

    if (fn[$$fnIdKey] == null) fn[$$fnIdKey] = nextFnId++;
    fn[$$fnKeys] = keys;

    for (let i = 0, il = keys.length; i < il; i++) {
      const key = keys[i];
      (map[key] || (map[key] = [])).push(fn);
    }

    return () => {
      for (let i = 0, il = keys.length; i < il; i++) {
        arrayRemove(map[keys[i]], fn);
      }
    };
  }

  throw new Error('multiple keys is not supported');
};


const define$map = (mapKey) => function() {
  const val = Object.create(null);
  defineHiddenConstant(this, mapKey, val);
  return val;
};


const $willSet = define$willSet($$willSetMap, null);
const $didSet = define$willSet($$didSetMap, $$didSetManyMap);
const $$willSetMapGetter = define$map($$willSetMap);
const $$didSetMapGetter = define$map($$didSetMap);
const $$didSetManyMapGetter = define$map($$didSetManyMap);

const $$initialGetter = function() {
  const val = Object.create(null);
  defineHiddenProperty(this, $$initial, val);
  return val;
};
const $$pendingGetter = function() {
  const val = Object.create(null);
  defineHiddenProperty(this, $$pending, val);
  return val;
};
const $$updatingGetter = function() {
  const val = false;
  defineHiddenProperty(this, $$updating, val);
  return val;
};
const $commitEnabledGetter = function() {
  const val = true;
  defineHiddenProperty(this, $commitEnabled, val);
  return val;
};


const computeSetter = (key, get) => function() {
  this[key] = get.apply(this, arguments);
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

const observablePropSetter = (key, $key, $queue, set, willSet) => {
  const hasSet = isFunction(set);
  const hasWillSet = isFunction(willSet);

  return function(newValue) {
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

    const initialUpdate = !this[$$updating];
    const pending = this[$$pending];
    const willSetMap = this[$$willSetMap];

    if (initialUpdate) {
      this[$$updating] = true;
    }

    this[$$initial][key] = this[$key];

    for (let i = 0; i < queue.length; i++) {
      const nextVal = queue[i];
      const val = this[$key];

      if (nextVal === val) continue;

      if (hasWillSet) {
        willSet.call(this, nextVal, val);
      }

      const willSets = willSetMap[key];
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
      pending[key] = nextVal;
    }

    queue.length = 0;

    if (initialUpdate && this[$commitEnabled]) {
      this.$commit();
    }
  };
};


function $commit() {
  // do didSet
  const initial = this[$$initial];
  const pending = this[$$pending];
  const propDidSetMap = this[$$propDidSet];
  const onDidSetMap = this[$$onDidSet];
  const onDidSetManyMap = this[$$onDidSetMany];
  const didSetMap = this[$$didSetMap];
  const didSetManyMap = this[$$didSetManyMap];

  this[$$updating] = false;
  this[$$pending] = Object.create(null);
  this[$$initial] = Object.create(null);

  const keys = Object.keys(pending);

  let onDidSetManyFns = [];
  let didSetManyFns = [];

  for (let i = 0, il = keys.length; i < il; i++) {
    const key = keys[i];
    const nextVal = pending[key];
    const val = initial[key];

    const didSet = propDidSetMap[key];
    if (didSet) {
      didSet.call(this, val, nextVal);
    }

    const onDidSets = onDidSetMap[key];
    if (onDidSets != null) {
      for (let j = 0, jl = onDidSets.length; j < jl; j++) {
        onDidSets[j].call(this);
      }
    }

    const didSets = didSetMap[key];
    if (didSets != null && didSets.length > 0) {
      const list = didSets.slice();
      for (let j = 0, jl = list.length; j < jl; j++) {
        list[j].call(this, val, nextVal);
      }
    }

    const onDidSetManys = onDidSetManyMap[key];
    if (onDidSetManys != null && onDidSetManys.length > 0) {
      onDidSetManyFns = onDidSetManyFns.concat(onDidSetManys);
    }

    const didSetManys = didSetManyMap[key];
    if (didSetManys != null && didSetManys.length > 0) {
      didSetManyFns = didSetManyFns.concat(didSetManys);
    }
  }

  if (onDidSetManyFns.length > 0) {
    const fnIdMap = Object.create(null);
    for (let i = 0, il = onDidSetManyFns.length; i < il; i++) {
      const fn = onDidSetManyFns[i];
      const fnId = fn[$$fnIdKey];
      if (!fnIdMap[fnId]) {
        fnIdMap[fnId] = true;
        fn.call(this);
      }
    }
  }

  if (didSetManyFns.length > 0) {
    const fnIdMap = Object.create(null);
    for (let i = 0, il = didSetManyFns.length; i < il; i++) {
      const fn = didSetManyFns[i];
      const fnId = fn[$$fnIdKey];
      if (!fnIdMap[fnId]) {
        fnIdMap[fnId] = true;
        const args = fn[$$fnKeys].map(
          (k) => (k in initial) ? initial[k] : this[k]
        );
        fn.apply(this, args);
      }
    }
  }
}


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
    [$$propDidSet]: Object.create(null),
    [$$onDidSetMany]: Object.create(null),
    [$$onDidSet]: Object.create(null),
    $willSet,
    $didSet,
    $commit,
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

  defineProperty(prototype, $$didSetManyMap, {
    get: $$didSetManyMapGetter,
    enumerable: false,
    configurable: false,
  });

  defineProperty(prototype, $$initial, {
    get: $$initialGetter,
    enumerable: false,
    configurable: false,
  });

  defineProperty(prototype, $$pending, {
    get: $$pendingGetter,
    enumerable: false,
    configurable: false,
  });

  defineProperty(prototype, $$updating, {
    get: $$updatingGetter,
    enumerable: false,
    configurable: false,
  });

  defineProperty(prototype, $commitEnabled, {
    get: $commitEnabledGetter,
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

  if (isFunction(didSet)) {
    Class.prototype[$$propDidSet][key] = didSet;
  }

  if (onDidSet != null && onDidSet.length > 0) {
    if (onDidSet.length === 1) {
      const map = Class.prototype[$$onDidSet];
      const onKey = onDidSet[0];
      (map[onKey] || (map[onKey] = [])).push(
        computeSetter(key, get)
      );
    } else {
      const manyMap = Class.prototype[$$onDidSetMany];
      const fn = computeSetter(key, get);
      fn[$$fnIdKey] = nextFnId++;
      for (let i = 0, il = onDidSet.length; i < il; i++) {
        const onKey = onDidSet[i];
        (manyMap[onKey] || (manyMap[onKey] = [])).push(fn);
      }
    }
  }

  const $key = create$key(key);
  const $queue = create$queue(key);

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
    set: observablePropSetter(
      key, $key, $queue,
      set, willSet
    ),
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

  if (isFunction(didSet)) {
    Class.prototype[$$propDidSet][key] = didSet;
  }

  const $key = create$key(key);
  const $queue = create$queue(key);

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
      observablePropSetter(
        key, $key, $queue,
        null, willSet
      ) :
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
