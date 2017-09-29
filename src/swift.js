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
  defineLazyHiddenPrototypeProperties,
} from './util';


const $initDesc = {
  value: true,
  enumerable: false,
  writable: true,
  configurable: false,
};

const defaultToJSON = (x) => x;

const $$defaultKeys = '$$defaultKeys';
const $$didChange = '$$didChange';
const $$didChangeAsync = '$$didChangeAsync';
const $$didChangeAsyncTid = '$$didChangeATID';
const $$didSetManyMap = '$$didSetManyMap';
const $$didChangeAsyncInitial = '$$didChangeAsyncInitial';
const $$didChangeAsyncPending = '$$didChangeAsyncPending';
const $$didSetMap = '$$didSetMap';
const $$enumerables = '$$enumerables';
const $$fnIdKey = '$$ID';
const $$fnKeys = '$$KEYS';
const $$init = '$$init';
const $$initial = '$$initial';
const $$onDidSet = '$$onDidSet';
const $$onDidSetMany = '$$onDidSetMany';
const $$pending = '$$pending';
const $$propDidSet = '$$propDidSet';
const $$toJSON = '$$toJSON';
const $$updating = '$$updating';
const $$willSetMap = '$$willSetMap';
const $commitEnabled = '$commitEnabled';

const create$key = (key) => `K$${key}`;
const create$queue = (key) => `Q$${key}`;

let nextFnId = 1;

const createOneTimeCallback = (fn) => {
  let called = false;
  return () => {
    if (!called) {
      called = true;
      fn();
      fn = null;
    }
  };
};

const define$willSet = (mapKey, manyMapKey) => function(keys, fn) {
  if (typeof keys === 'string' || keys.length === 1) {
    const map = this[mapKey];
    const key = typeof keys === 'string' ? keys : keys[0];
    (map[key] || (map[key] = [])).push(fn);
    return createOneTimeCallback(() => arrayRemove(map[key], fn));
  }

  if (manyMapKey) {
    const map = this[manyMapKey];

    if (fn[$$fnIdKey] == null) fn[$$fnIdKey] = nextFnId++;
    fn[$$fnKeys] = keys;

    for (let i = 0, il = keys.length; i < il; i++) {
      const key = keys[i];
      (map[key] || (map[key] = [])).push(fn);
    }

    return createOneTimeCallback(() => {
      for (let i = 0, il = keys.length; i < il; i++) {
        arrayRemove(map[keys[i]], fn);
      }
    });
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

const createPrimitiveValueGetter = (key, val) => function() {
  defineHiddenProperty(this, key, val);
  return val;
};
const createArrayValueGetter = (key) => function() {
  const val = [];
  defineHiddenProperty(this, key, val);
  return val;
};
const createNullMapGetter = (key) => function() {
  const val = Object.create(null);
  defineHiddenProperty(this, key, val);
  return val;
};

const $$didChangeGetter = createArrayValueGetter($$didChange);

const $$didChangeAsyncGetter = createArrayValueGetter($$didChangeAsync);

const $$didChangeAsyncTidGetter = createPrimitiveValueGetter($$didChangeAsyncTid, null);

const $$didChangeAsyncInitialGetter = createNullMapGetter($$didChangeAsyncInitial);

const $$didChangeAsyncPendingGetter = createNullMapGetter($$didChangeAsyncPending);

const $$initialGetter = createNullMapGetter($$initial);

const $$pendingGetter = createNullMapGetter($$pending);

const $$updatingGetter = createPrimitiveValueGetter($$updating, false);

const $commitEnabledGetter = createPrimitiveValueGetter($commitEnabled, true);


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

const observablePropGetterWithGetter = (key, $key, get, format) =>
  isFunction(format) ?
    function() {
      return format(this.hasOwnProperty($key) ?
        this[$key] :
        (this[key] = get.call(this))
      );
    } :
    function() {
      return this.hasOwnProperty($key) ?
        this[$key] :
        (this[key] = get.call(this));
    };

const observablePropGetterWithDefaultValue = (key, $key, value, format) =>
  isFunction(format) ?
    function() {
      return format(this.hasOwnProperty($key) ?
        this[$key] :
        (this[key] = value)
      );
    } :
    function() {
      return this.hasOwnProperty($key) ?
        this[$key] :
        (this[key] = value);
    };

const simpleGetter = ($key, format) =>
  isFunction(format) ?
    function() { return format(this[$key]); } :
    function() { return this[$key]; };

const readOnlyPropSetter = ($key) => function(val) {
  if (this[$$init]) {
    this[$key] = val;
  }
};

const observablePropSetter = (key, $key, $queue, set, willSet, parse, equal) => {
  const hasParse = isFunction(parse);
  const hasEqual = isFunction(equal);
  const hasSet = isFunction(set);
  const hasWillSet = isFunction(willSet);

  return function(newValue) {
    if (hasParse) newValue = parse(newValue);

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

      if (hasEqual ? equal(nextVal, val) : (nextVal === val)) {
        continue;
      }

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

    if (initialUpdate && this.$commitEnabled) {
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
  let changed = false;

  for (let i = 0, il = keys.length; i < il; i++) {
    const key = keys[i];
    const nextVal = pending[key];
    const val = initial[key];

    if (nextVal === val) {
      delete pending[key];
      delete initial[key];
      continue;
    }

    changed = true;

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
        fn.call(this, initial, pending);
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
        fn.call(this, initial, pending);
      }
    }
  }

  if (changed) {
    const fns = this[$$didChange];
    if (fns.length > 0) {
      const copy = fns.slice();
      for (let i = 0, il = copy.length; i < il; i++) {
        copy[i].call(this, initial, pending);
      }
    }

    const asyncFns = this[$$didChangeAsync];
    if (asyncFns.length > 0) {
      if (this[$$didChangeAsyncTid] == null) {
        this[$$didChangeAsyncInitial] = initial;
        this[$$didChangeAsyncPending] = pending;
        this[$$didChangeAsyncTid] = setTimeout(
          callDidChangeAsync.bind(this, asyncFns.slice()), 0
        );
      } else {
        this[$$didChangeAsyncInitial] = Object.assign(initial, this[$$didChangeAsyncInitial]);
        this[$$didChangeAsyncPending] = Object.assign(this[$$didChangeAsyncPending], pending);
      }
    }
  }
}

function callDidChangeAsync(fns) {
  this[$$didChangeAsyncTid] = null;
  const initial = this[$$didChangeAsyncInitial];
  const pending = this[$$didChangeAsyncPending];
  this[$$didChangeAsyncInitial] = this[$$didChangeAsyncPending] = null;
  for (let i = 0, il = fns.length; i < il; i++) {
    fns[i].call(this, initial, pending);
  }
}


function $set(values) {
  const prev$commitEnabled = this.$commitEnabled;
  this.$commitEnabled = false;
  Object.assign(this, values);
  this.$commitEnabled = prev$commitEnabled;
  this.$commit();
}


function $didChange(fn) {
  const arr = this[$$didChange];
  arr.push(fn);
  return createOneTimeCallback(() => arrayRemove(arr, fn));
}


function $didChangeAsync(fn) {
  const arr = this[$$didChangeAsync];
  arr.push(fn);
  return createOneTimeCallback(() => arrayRemove(arr, fn));
}

function toJSON() {
  const map = this[$$toJSON];
  const keys = Object.keys(map);
  const json = {};
  for (let i = 0, il = keys.length; i < il; i++) {
    const key = keys[i];
    json[key] = map[key].call(this, this[key]);
  }
  return json;
}

const createToJSON = (protoToJSON) => protoToJSON ?
  function() {
    return protoToJSON.call(this, toJSON.call(this));
  } :
  toJSON;


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

const reservedKeys = {
  $commit: 1,
  $commitEnabled: 1,
  $didSet: 1,
  $set: 1,
  $willSet: 1,
  [$$defaultKeys]: 1,
  [$$didChangeAsyncInitial]: 1,
  [$$didChangeAsyncPending]: 1,
  [$$didChangeAsyncTid]: 1,
  [$$didChangeAsync]: 1,
  [$$didChange]: 1,
  [$$didSetManyMap]: 1,
  [$$didSetMap]: 1,
  [$$enumerables]: 1,
  [$$fnIdKey]: 1,
  [$$fnKeys]: 1,
  [$$init]: 1,
  [$$initial]: 1,
  [$$onDidSetMany]: 1,
  [$$onDidSet]: 1,
  [$$pending]: 1,
  [$$propDidSet]: 1,
  [$$toJSON]: 1,
  [$$updating]: 1,
  [$$willSetMap]: 1,
  toJSON: 1,
};

const create = (props) => {
  const Class = createNewClass();

  const {prototype} = Class;

  prototype[$$enumerables] = Object.create(null);

  defineHiddenConstants(prototype, {
    [$$defaultKeys]: [],
    [$$propDidSet]: Object.create(null),
    [$$onDidSetMany]: Object.create(null),
    [$$onDidSet]: Object.create(null),
    [$$toJSON]: Object.create(null),
    $commit,
    $didChange,
    $didChangeAsync,
    $didSet,
    $set,
    $willSet,
    toJSON: createToJSON(props.toJSON),
  });

  defineLazyHiddenPrototypeProperties(prototype, {
    $commitEnabled: $commitEnabledGetter,
    [$$didChangeAsyncInitial]: $$didChangeAsyncInitialGetter,
    [$$didChangeAsyncPending]: $$didChangeAsyncPendingGetter,
    [$$didChangeAsyncTid]: $$didChangeAsyncTidGetter,
    [$$didChangeAsync]: $$didChangeAsyncGetter,
    [$$didChange]: $$didChangeGetter,
    [$$didSetManyMap]: $$didSetManyMapGetter,
    [$$didSetMap]: $$didSetMapGetter,
    [$$initial]: $$initialGetter,
    [$$pending]: $$pendingGetter,
    [$$updating]: $$updatingGetter,
    [$$willSetMap]: $$willSetMapGetter,
  });


  const propKeys = Object.getOwnPropertyNames(props);

  for (let i = 0, il = propKeys.length; i < il; i++) {
    const key = propKeys[i];

    if (reservedKeys[key] === 1) continue;

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
  toJSON, // eslint-disable-line no-shadow
}) => {
  if (key === 'toJSON') return;

  assertUndefined('onDidSet', onDidSet, 'method', key);
  assertUndefined('get', get, 'method', key);
  assertUndefined('set', set, 'method', key);
  assertUndefined('willSet', willSet, 'method', key);
  assertUndefined('didSet', didSet, 'method', key);
  assertUndefined('lazy', lazy, 'method', key);
  assertUndefined('value', value, 'method', key);
  assertUndefined('writable', writable, 'method', key);
  assertUndefined('enumerable', enumerable, 'method', key);
  assertUndefined('toJSON', toJSON, 'method', key);

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
  toJSON, // eslint-disable-line no-shadow
}) => {
  assertUndefined('onDidSet', onDidSet, 'lazy', key);
  assertUndefined('get', get, 'lazy', key);
  assertUndefined('set', set, 'lazy', key);
  assertUndefined('willSet', willSet, 'lazy', key);
  assertUndefined('didSet', didSet, 'lazy', key);
  assertUndefined('method', method, 'lazy', key);
  assertUndefined('value', value, 'lazy', key);

  if (toJSON) {
    if (!isFunction(toJSON)) {
      toJSON = defaultToJSON;
    }
    Class.prototype[$$toJSON][key] = toJSON;
  }

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
  parse,
  equal,
  format,
  writable,
  enumerable = false,
  toJSON, // eslint-disable-line no-shadow
}) => {
  assertUndefined('lazy', lazy, 'get/set', key);
  assertUndefined('method', method, 'get/set', key);
  assertUndefined('value', value, 'get/set', key);
  assertUndefined('writable', writable, 'get/set', key);

  if (isFunction(didSet)) {
    Class.prototype[$$propDidSet][key] = didSet;
  }

  if (toJSON) {
    if (!isFunction(toJSON)) {
      toJSON = defaultToJSON;
    }
    Class.prototype[$$toJSON][key] = toJSON;
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
      observablePropGetterWithGetter(key, $key, get, format) :
      simpleGetter($key, format),
    set: observablePropSetter(
      key, $key, $queue,
      set, willSet, parse, equal
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
  parse,
  equal,
  format,
  writable = true,
  enumerable = false,
  toJSON, // eslint-disable-line no-shadow
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

  if (toJSON) {
    if (!isFunction(toJSON)) {
      toJSON = defaultToJSON;
    }
    Class.prototype[$$toJSON][key] = toJSON;
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
      observablePropGetterWithDefaultValue(key, $key, value, format) :
      simpleGetter($key, format),
    set: writable ?
      observablePropSetter(
        key, $key, $queue,
        null, willSet, parse, equal
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
