//
//  index.ts
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
import { ISchema, TypeOfSchema, SchemaBuilder } from '../internals/types';
import { ValidateError } from '../error';
import * as _rules from './rules';

export const array = <T extends ISchema<any, any>>(type?: T): ISchema<TypeOfSchema<T>[], typeof _rules> => SchemaBuilder({
  type: 'array',
  default: [],
  rules: [],
  transform: (v) => _.isArray(v) ? _.map(v, v => type?.transform(v) ?? v) : undefined,
}, _rules, (internals, builder) => ({

  validate(
    value: any,
    path?: string | string[],
  ) {

    const _value = internals.transform(value);

    for (const rule of internals.rules) {
      if (!rule.validate(_value)) {
        throw new ValidateError(internals.type, rule.rule, _.toPath(path));
      }
    };

    if (!_.isNil(_value) && !_.isArray(_value)) {
      throw new ValidateError(internals.type, 'type', _.toPath(path));
    }
    
    if (!_.isNil(_value)) {
      for (const [i, item] of _value.entries()) {
        type?.validate(item, [..._.toPath(path), `${i}`]);
      }
    }
  },

}));
