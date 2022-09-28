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

export interface ISchema<Type> {

  default(value: Type): ISchema<Type>

  getDefault(): Type | undefined

  transform(
    t: (value: any) => any
  ): ISchema<Type>

  validate(
    value: any,
    path?: string | string[],
  ): void
}

type Internals<Type> = {
  type: string;
  default?: Type;
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

type IRules = Record<string, (value: any, ...args: any[]) => boolean>

type IExtension<Type, P, E> = (
  internals: P & Internals<Type>,
  builder: (internals: Partial<P | Internals<Type>>) => ISchema<Type>
) => E

const RulesLoader = <Type, P, E>(
  rules: IRules,
  internals: P & Internals<Type>,
  builder: (internals: Partial<P | Internals<Type>>) => ISchema<Type>
) => _.mapValues(rules, (rule, key) => (...args: any[]) => builder({
  rules: [...internals.rules, { rule: key, validate: (v) => rule(v, ...args) }],
}));

export const SchemaBuilder = <Type, P, E>(
  internals: P & Internals<Type>,
  extension: IExtension<Type, P, E>
): ISchema<Type> & E => {

  const builder = (v: Partial<P | Internals<Type>>) => SchemaBuilder({ ...internals, ...v }, extension);

  return {

    default(
      value: Type
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
    
    ...RulesLoader(common_rules, internals, builder),
    
    ...extension(internals, builder),
  
  }
};
