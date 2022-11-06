//
//  channel.js
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
import EventEmitter from 'events';
import { IState } from './types';

const emitter_maps = new WeakMap();

export const createChannel = <T = any>(initialValue: T): IState<T> => {

  const emitter = new EventEmitter();
  let current = initialValue;

  return new class implements IState<T> {

    constructor() {
      emitter_maps.set(this, emitter);
    }

    get current() {
      return current;
    }

    setValue(value: React.SetStateAction<T>) {
      current = _.isFunction(value) ? value(current) : value;
      emitter.emit('update', current);
    }
  };
}

export const useChannel = <T = any>(channel: IState<T>) => {

  const [value, setValue] = React.useState(channel.current);

  React.useEffect(() => {
    const emitter = emitter_maps.get(channel);
    emitter.addListener('update', setValue);
    return () => { emitter.removeListener('update', setValue); }
  }, [setValue]);

  return value;
}
