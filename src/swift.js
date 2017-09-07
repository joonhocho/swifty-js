/* eslint no-underscore-dangle: 0, no-use-before-define: 0, max-params: 0, max-statements: 0 */
import {
  isPlainObject,
  isFunction,
  defineProperty,
  defineHiddenConstant,
  defineHiddenConstants,
  setOrDefineHiddenProperty,
  setOrDefineHiddenDeletableProperty,
} from './util';


const $initDesc = {
  value: true,
  enumerable: false,
  writable: true,
  configurable: false,
};


const createSetHandler = (index, fn, keys) => function(newValue) {
  const args = [];
  for (let i = 0, il = keys.length; i < il; i++) {
    args.push(i === index ? newValue : this[keys[i]]);
  }
  fn.apply(this, args);
};


const create = (props) => {
  const propKeys = Object.getOwnPropertyNames(props);

  class Class {
    constructor(data) {
      defineProperty(this, '$$init', $initDesc);

      const {$$enumerables} = this;
      if ($$enumerables) {
        Object.defineProperties(this, $$enumerables);
      }

      const {$$defaultKeys} = this;
      if ($$defaultKeys.length > 0) {
        for (let i = 0, il = $$defaultKeys.length; i < il; i++) {
          const key = $$defaultKeys[i];
          if (!(key in data)) {
            this[key] = this[key];
          }
        }
      }

      Object.assign(this, data);

      this.$$init = false;
    }
  }
  const {prototype} = Class;

  prototype.$$enumerables = Object.create(null);

  defineHiddenConstants(prototype, {
    $$defaultKeys: [],
    $$onDidSet: Object.create(null),
    $willSet(keys, fn) {
      const {$$willSetMap} = this;
      if (typeof keys === 'string' || keys.length === 1) {
        const key = typeof keys === 'string' ? keys : keys[0];
        ($$willSetMap[key] || ($$willSetMap[key] = [])).push(fn);
      } else {
        // keys
        for (let i = 0, il = keys.length; i < il; i++) {
          const key = keys[i];
          ($$willSetMap[key] || ($$willSetMap[key] = [])).push(
            createSetHandler(i, fn, keys)
          );
        }
      }
    },
    $didSet(keys, fn) {
      const $$didSetMap = this.$$didSetMap;
      if (typeof keys === 'string' || keys.length === 1) {
        const key = typeof keys === 'string' ? keys : keys[0];
        ($$didSetMap[key] || ($$didSetMap[key] = [])).push(fn);
      } else {
        // keys
        for (let i = 0, il = keys.length; i < il; i++) {
          const key = keys[i];
          ($$didSetMap[key] || ($$didSetMap[key] = [])).push(
            createSetHandler(i, fn, keys)
          );
        }
      }
    },
  });

  defineProperty(prototype, '$$willSetMap', {
    get() {
      const val = Object.create(null);
      defineHiddenConstant(this, '$$willSetMap', val);
      return val;
    },
    enumerable: false,
    configurable: false,
  });


  defineProperty(prototype, '$$didSetMap', {
    get() {
      const val = Object.create(null);
      defineHiddenConstant(this, '$$didSetMap', val);
      return val;
    },
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

  if (Object.keys(prototype.$$enumerables).length > 0) {
    defineHiddenConstant(prototype, '$$enumerables', prototype.$$enumerables);
  } else {
    defineHiddenConstant(prototype, '$$enumerables', null);
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
    Class.prototype.$$enumerables[key] = desc;
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
  const $valueQueue = `$_${key}`;

  const hasSet = isFunction(set);
  const hasWillSet = isFunction(willSet);
  const hasDidSet = isFunction(didSet);

  if (onDidSet != null && onDidSet.length > 0) {
    for (let i = 0, il = onDidSet.length; i < il; i++) {
      const on = onDidSet[i];
      const {$$onDidSet} = Class.prototype;
      ($$onDidSet[on] || ($$onDidSet[on] = [])).push(
        function() { this[key] = get.call(this); }
      );
    }
  }

  const desc = {
    get: isFunction(get) ? function() {
      if (this.hasOwnProperty($key)) {
        return this[$key];
      }
      this[key] = get.call(this);
      return value;
    } : function() {
      return this[$key];
    },
    set(newValue) {
      let queue = this[$valueQueue];
      if (!queue) {
        queue = [];
        setOrDefineHiddenDeletableProperty(this, $valueQueue, queue);
      }

      if (queue.indexOf(newValue) >= 0) {
        return;
      }

      queue.push(newValue);
      if (queue.length > 1) return;

      for (let i = 0; i < queue.length; i++) {
        const newVal = queue[i];
        const val = this[$key];

        if (newVal === val) continue;

        if (hasWillSet) {
          willSet.call(this, newVal, val);
        }

        const willSets = this.$$willSetMap[key];
        if (willSets != null && willSets.length > 0) {
          const list = willSets.slice();
          for (let j = 0, jl = list.length; j < jl; j++) {
            list[j].call(this, newVal, val);
          }
        }

        if (hasSet) {
          set.call(this, newVal, val);
        }

        setOrDefineHiddenProperty(this, $key, newVal);

        if (hasDidSet) {
          didSet.call(this, val, newVal);
        }

        const $on = this.$$onDidSet[key];
        if ($on != null) {
          for (let j = 0, jl = $on.length; j < jl; j++) {
            $on[j].call(this);
          }
        }

        const didSets = this.$$didSetMap[key];
        if (didSets != null && didSets.length > 0) {
          const list = didSets.slice();
          for (let j = 0, jl = list.length; j < jl; j++) {
            list[j].call(this, val, newVal);
          }
        }
      }

      queue.length = 0;
    },
    enumerable,
    configurable: false,
  };

  if (enumerable) {
    Class.prototype.$$enumerables[key] = desc;
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
    Class.prototype.$$defaultKeys.push(key);
  }

  const hasWillSet = isFunction(willSet);
  const hasDidSet = isFunction(didSet);

  const $key = `$${key}`;
  const $valueQueue = `$_${key}`;

  const desc = {
    get: hasDefaultValue ? function() {
      if (this.hasOwnProperty($key)) {
        return this[$key];
      }
      this[key] = value;
      return value;
    } : function() {
      return this[$key];
    },
    set: writable ? function(newValue) {
      let queue = this[$valueQueue];
      if (!queue) {
        queue = [];
        setOrDefineHiddenDeletableProperty(this, $valueQueue, queue);
      }

      if (queue.indexOf(newValue) >= 0) {
        return;
      }

      queue.push(newValue);
      if (queue.length > 1) return;

      for (let i = 0; i < queue.length; i++) {
        const newVal = queue[i];
        const val = this[$key];

        if (newVal === val) continue;

        if (hasWillSet) {
          willSet.call(this, newVal, val);
        }

        const willSets = this.$$willSetMap[key];
        if (willSets != null && willSets.length > 0) {
          const list = willSets.slice();
          for (let j = 0, jl = list.length; j < jl; j++) {
            list[j].call(this, newVal, val);
          }
        }

        setOrDefineHiddenProperty(this, $key, newVal);

        if (hasDidSet) {
          didSet.call(this, val, newVal);
        }

        const $on = this.$$onDidSet[key];
        if ($on != null) {
          for (let j = 0, jl = $on.length; j < jl; j++) {
            $on[j].call(this);
          }
        }

        const didSets = this.$$didSetMap[key];
        if (didSets != null && didSets.length > 0) {
          const list = didSets.slice();
          for (let j = 0, jl = list.length; j < jl; j++) {
            list[j].call(this, val, newVal);
          }
        }
      }

      queue.length = 0;
    } : function(newValue) {
      if (this.$$init) {
        setOrDefineHiddenProperty(this, $key, newValue);
      }
    },
    enumerable,
    configurable: false,
  };

  if (enumerable) {
    Class.prototype.$$enumerables[key] = desc;
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
