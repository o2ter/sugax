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

export interface ISchema<T> {

  default(value: T): ISchema<T>

  getDefault(): T | undefined

  transform(
    t: (value: any) => any
  ): ISchema<T>

  validate(
    value: any,
    path?: string | string[],
  ): void
}

type Internals<T> = {
  type: string;
  default?: T;
  rules: ({ rule: string, validate: (value: any) => boolean })[];
  transform: (value: any) => any;
}

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

type OmitFirstArg<F> = F extends (x: any, ...args: infer P) => infer R ? (...args: P) => R : never;

type IRules = Record<string, (value: any, ...args: any[]) => boolean>

type IExtension<T, P, E> = (
  internals: P & Internals<T>,
  builder: (internals: Partial<P | Internals<T>>) => ISchema<T>
) => E

type SchemaType<T, E> = ISchema<T> & E & {
  [K in keyof typeof common_rules]: (...args: any[]) => SchemaType<T, E>;
}

export const RulesLoader = <T, R extends IRules, P, E>(
  rules: R,
  internals: P & Internals<T>,
  builder: (internals: Partial<P | Internals<T>>) => SchemaType<T, E>
) => _.mapValues(rules, (rule, key) => (...args: any[]) => builder({
  rules: [...internals.rules, { rule: key, validate: (v) => rule(v, ...args) }],
}));

const CommonRulesLoader = <T, P, E>(
  internals: P & Internals<T>,
  builder: (internals: Partial<P | Internals<T>>) => SchemaType<T, E>
) => RulesLoader(common_rules, internals, builder);

export const SchemaBuilder = <T, P, E>(
  internals: P & Internals<T>,
  extension: IExtension<T, P, E>
): SchemaType<T, E> => {

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
