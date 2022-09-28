//
//  types.ts
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
import * as common_rules from './common_rules';

import { ValidateError } from './error';

type Internals<T> = {
  type: string;
  default?: T;
  rules: ({ rule: string, validate: (value: any) => boolean })[];
  transform: (value: any) => any;
}

type OmitFirstArg<F> = F extends (x: any, ...args: infer P) => infer R ? (...args: P) => R : never;

type RuleType = Record<string, (...args: any) => boolean>

type MappedRules<T, R extends RuleType, E> = {
  [K in keyof R]: (...args: Parameters<OmitFirstArg<R[K]>>) => ISchema<T, R, E>;
}

export type ISchema<T, R extends RuleType, E> = {

  default(value: T): ISchema<T, R, E>

  getDefault(): T | undefined

  transform(
    t: (value: any) => any
  ): ISchema<T, R, E>

  validate(
    value: any,
    path?: string | string[],
  ): void

} & MappedRules<T, typeof common_rules & R, E> & E

export const SchemaBuilder = <T, E, R extends RuleType, P>(
  internals: P & Internals<T>,
  rules: R,
  extension: (
    internals: P & Internals<T>,
    builder: (internals: Partial<P | Internals<T>>) => ISchema<T, R, E>
  ) => E
): ISchema<T, R, E> => {

  const builder = (v: Partial<P | Internals<T>>) => SchemaBuilder({ ...internals, ...v }, rules, extension);

  const RulesLoader = <R2 extends RuleType>(
    rules: R2
  ) => _.mapValues(rules, (rule, key) => (...args: any) => builder({
    rules: [...internals.rules, { rule: key, validate: (v) => rule(v, ...args) }],
  }));
  
  return {

    default(
      value: T
    ) {
      return builder({ default: value });
    },
  
    getDefault() {
      return internals.default;
    },
  
    transform(
      t: (value: any) => any
    ) {
      return builder({ transform: t });
    },
  
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
    },
    
    ...RulesLoader(common_rules),
    ...RulesLoader(rules),
    ...extension(internals, builder),
  }
};
