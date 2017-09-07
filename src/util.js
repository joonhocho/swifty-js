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

const setOrDefineHiddenProperty = (obj, key, value) => {
  if (obj.hasOwnProperty(key)) {
    obj[key] = value;
  } else {
    defineProperty(obj, key, {
      value,
      enumerable: false,
      writable: true,
      configurable: false,
    });
  }
};

const setOrDefineHiddenDeletableProperty = (obj, key, value) => {
  if (obj.hasOwnProperty(key)) {
    obj[key] = value;
  } else {
    defineProperty(obj, key, {
      value,
      enumerable: false,
      writable: true,
      configurable: true,
    });
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
  defineProperty,
  defineHiddenConstant,
  defineHiddenConstants,
  setOrDefineHiddenProperty,
  setOrDefineHiddenDeletableProperty,
  defineLazyProperty,
};

export default {
  isPlainObject,
  isPromise,
  defineProperty,
  defineHiddenConstant,
  defineHiddenConstants,
  setOrDefineHiddenProperty,
  setOrDefineHiddenDeletableProperty,
  defineLazyProperty,
};
