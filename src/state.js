//
//  state.js
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

export const selector = ({current, setValue}, key) => Object.freeze({
    get current() { 
        return current[key]; 
    },
    setValue(value) {
        if (_.isArrayLike(current)) {
            const updated = [...current];
            updated[key] = value;
            setValue(updated);
        } else if (_.isPlainObject(current)) {
            const updated = {...current};
            updated[key] = value;
            setValue(updated);
        }
    }
})

export const selectElements = ({current, setValue}) => {
    if (_.isArrayLike(current)) {
      return current.map((_x, i) => selector({current, setValue}, i));
    } else {
      return _.mapValues(current, (_value, key) => selector({current, setValue}, key));
    }
}

export const useMapState = ({...initialState}) => {

    const [_state, _setState] = React.useState(initialState);
    
    return Object.freeze(_.mapValues(_state, (value, key) => { 
        return Object.freeze({
            get current() { return value; },
            setValue: (value) => _setState({ ..._state, [key]: value }),
        });
    }));
}

export const combineState = ({...initialState}, component) => ({...props}) => {

    const [_state, _setState] = React.useState(initialState);

    return component(props, Object.freeze(_.mapValues(_state, (value, key) => { 
        return Object.freeze({
            get current() { return value; },
            setValue: (value) => _setState({ ..._state, [key]: value }),
        });
    })), (values) => _setState({ ..._state, ...values }));
}
