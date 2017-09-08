/* eslint no-self-compare: 0 */
const isPlainObject = (x) =>
  x !== null &&
  typeof x === 'object' &&
  (x.constructor == null || x.constructor === Object);


const isFunction = (x) =>
  typeof x === 'function';


const isPromise = (x) =>
  x !== null &&
  typeof x === 'object' &&
  typeof x.then === 'function';


const arrayRemove = (list, item) => {
  const index = list.indexOf(item);
  const found = index >= 0;
  if (found) list.splice(index, 1);
  return found;
};

const arrayIndexOfNaN = (list, item) => {
  if (item !== item) {
    // isNaN
    for (let i = 0, il = list.length; i < il; i++) {
      const aItem = list[i];
      if (aItem !== aItem) return i;
    }
    return -1;
  }

  return list.indexOf(item);
};


const {defineProperty} = Object;

const defineHiddenConstant = (obj, key, value) =>
  defineProperty(obj, key, {
    value,
    enumerable: false,
    writable: false,
    configurable: false,
  });

const defineHiddenConstants = (obj, values) =>
  Object.keys(values).forEach((key) =>
    defineProperty(obj, key, {
      value: values[key],
      enumerable: false,
      writable: false,
      configurable: false,
    })
  );

const defineHiddenProperty = (obj, key, value) =>
  defineProperty(obj, key, {
    value,
    enumerable: false,
    writable: true,
    configurable: true,
  });


const setOrDefineHiddenProperty = (obj, key, value) => {
  if (obj.hasOwnProperty(key)) {
    obj[key] = value;
  } else {
    defineHiddenProperty(obj, key, value);
  }
};


const defineLazyProperty = (obj, name, fn, {
  writable = true,
  enumerable = true,
  configurable = true,
} = {}) =>
  Object.defineProperty(obj, name, {
    get() {
      // Use 'this' instead of obj so that obj can be a prototype.
      const value = fn.call(this);
      Object.defineProperty(this, name, {
        value,
        writable,
        enumerable,
        configurable,
      });
      return value;
    },
    enumerable,
    configurable: true,
  });


export {
  isPlainObject,
  isFunction,
  isPromise,
  arrayRemove,
  arrayIndexOfNaN,
  defineProperty,
  defineHiddenConstant,
  defineHiddenConstants,
  defineHiddenProperty,
  setOrDefineHiddenProperty,
  defineLazyProperty,
};

export default {
  isPlainObject,
  isFunction,
  isPromise,
  arrayRemove,
  arrayIndexOfNaN,
  defineProperty,
  defineHiddenConstant,
  defineHiddenConstants,
  defineHiddenProperty,
  setOrDefineHiddenProperty,
  defineLazyProperty,
};
