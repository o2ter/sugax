//
//  index.ts
//
//  The MIT License
//  Copyright (c) 2021 - 2023 O2ter Limited. All rights reserved.
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
import { ISchema, TypeOfSchema, SchemaBuilder } from '../builder';
import { ValidateError } from '../error';
import * as _rules from './rules';

export const array = <T extends ISchema<any, any>>(type?: T) => SchemaBuilder<TypeOfSchema<T>[], typeof _rules>({
  type: 'array',
  default: [],
  rules: [],
  transform: (v) => _.isArray(v) ? _.isNil(type) ? v : _.map(v, v => type.cast(v)) : undefined,
  typeCheck: _.isArray,
  validate: (value: any) => {

    if (_.isNil(value) || _.isNil(type)) return [];

    const errors: ValidateError[] = [];

    for (const [i, item] of value.entries()) {
      errors.push(...type.validate(item).map(x => new ValidateError({
        ...x.options,
        path: [`${i}`, ...x.path],
      })));
    }

    return errors;
  },
}, _rules);
