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

export class ValidateError extends Error {

  type: string;
  rule: string;
  path?: string[];

  constructor(
    type: string,
    rule: string,
    path?: string[]
  ) {
    super();
    this.type = type;
    this.rule = rule;
    this.path = path;
  }
}

export type Internals<T> = {
  type: string;
  default?: T;
  rules: ({ rule: string, validate: (value: any) => boolean })[];
  transform: (value: any) => any;
}

export type OmitFirstArg<F> = F extends (x: any, ...args: infer P) => infer R ? (...args: P) => R : never;

type RuleType = Record<string, (...args: any) => boolean>

export type MappedRules<R extends RuleType> = {
  [K in keyof R]: OmitFirstArg<R[K]>;
}

export type ISchema<T, E> = {

  default(value: T): ISchema<T, E>

  getDefault(): T | undefined

  transform(
    t: (value: any) => any
  ): ISchema<T, E>

  validate(
    value: any,
    path?: string | string[],
  ): void
  
} & MappedRules<typeof common_rules> & E

type IExtension<T, E, P> = (
  internals: P & Internals<T>,
  builder: (internals: Partial<P | Internals<T>>) => ISchema<T, E>
) => E

export const RulesLoader = <T, E, R extends RuleType, P>(
  rules: R,
  internals: P & Internals<T>,
  builder: (internals: Partial<P | Internals<T>>) => ISchema<T, E>
) => _.mapValues(rules, (rule, key) => (...args: any) => builder({
  rules: [...internals.rules, { rule: key, validate: (v) => rule(v, ...args) }],
})) as MappedRules<R>;

const CommonRulesLoader = <T, E, P>(
  internals: P & Internals<T>,
  builder: (internals: Partial<P | Internals<T>>) => ISchema<T, E>
) => RulesLoader(common_rules, internals, builder);

export const SchemaBuilder = <T, E, P>(
  internals: P & Internals<T>,
  extension: IExtension<T, E, P>
): ISchema<T, E> => {

  const builder = (v: Partial<P | Internals<T>>) => SchemaBuilder({ ...internals, ...v }, extension);

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
    
    ...CommonRulesLoader(internals, builder),
    
    ...extension(internals, builder),
  }
};
