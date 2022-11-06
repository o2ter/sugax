//
//  state.ts
//
//  The MIT License
//  Copyright (c) 2021 - 2022 O2ter Limited. All rights reserved.
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//

import _ from 'lodash';
import React from 'react';
import { IState } from './types';

function replace_key<T extends any[] | object>(
  state: T,
  key: keyof T,
  value: T[keyof T]
) {
  const copy = _.clone(state);
  copy[key] = value;
  return copy;
}

export const selector = <T extends any[] | object>(
  state: IState<T>,
  key: keyof T
): IState<T[keyof T]> => Object.freeze({
  get current() {
    return state.current[key];
  },
  setValue(value) {
    state.setValue(state => replace_key(state, key, _.isFunction(value) ? value(state[key]) : value));
  }
})

export const selectElements = <T extends any[] | object>(state: IState<T>) => {
  if (_.isArrayLike(state.current)) {
    return _.map(state.current, (_x, i) => selector(state, i as keyof T));
  } else {
    return _.mapValues(state.current, (_value, key) => selector(state, key as keyof T));
  }
}

export const useMapState = <T extends object>(initialState: T) => {

  const [_state, _setState] = React.useState(initialState);

  return Object.freeze(_.mapValues(_state, (value, key): IState<T[keyof T]> => Object.freeze({
    get current() { return value; },
    setValue: (value) => _setState(state => ({ ...state, [key]: _.isFunction(value) ? value(state[key as keyof T]) : value })),
  })));
}
