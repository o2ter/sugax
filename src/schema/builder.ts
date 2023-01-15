//
//  builder.ts
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
import * as common_rules from './common_rules';
import { ValidateError } from './error';

type Internals<T> = {

  type: string;
  default?: T;

  label?: string,
  rules: ({
    rule: string,
    validate: (
      value: any,
      error: (attrs: Record<string, string>, msg?: string) => ValidateError
    ) => ValidateError | undefined,
  })[];

  transform: (value: any) => any;
  typeCheck: (value: any) => boolean;
  validate?: (value: any) => ValidateError[];

}

type OmitFirstArg<F> = F extends (x: any, ...args: infer P) => infer R ? (...args: P) => R : never;
type RuleType = Record<string, (...args: any) => ValidateError | undefined>;

type MappedRules<T, R extends RuleType, R2 extends RuleType> = {
  [K in keyof R2]: (...args: Parameters<OmitFirstArg<OmitFirstArg<R2[K]>>>) => ISchema<T, R>;
}

export type ISchema<T, R extends RuleType> = {

  cast: (value: any) => any;

  validate(value: any): ValidateError[];

  strict(): ISchema<T, R>;

  label(name: string): ISchema<T, R>;

  default(value: T): ISchema<T, R>;

  getDefault(): T | undefined;

  transform(
    t: (value: any) => any
  ): ISchema<T, R>;

} & MappedRules<T, R, R & typeof common_rules>;

export type TypeOfSchema<S> = S extends ISchema<infer T, any> ? T : never;

export const SchemaBuilder = <T, R extends RuleType = {}>(
  internals: Internals<T>,
  rules: R
): ISchema<T, R> => {

  const builder = (v: Partial<Internals<T>>) => SchemaBuilder({ ...internals, ...v }, rules);

  const RulesLoader = <R2 extends RuleType>(
    rules: R2
  ) => _.mapValues(rules, (rule, key) => (...args: any) => builder({
    rules: [...internals.rules, { rule: key, validate: (v, error) => rule(v, error, ...args) }],
  }));

  const cast = (value: any) => {
    return internals.transform(value);
  };

  const validate = _.memoize((value: any) => {

    const errors: ValidateError[] = [];
    const _value = cast(value);

    const opts = {
      type: internals.type,
      label: internals.label,
    };

    for (const rule of internals.rules) {
      const error = rule.validate(_value, (attrs, msg) => new ValidateError({
        ...opts,
        rule: rule.rule,
        attrs,
        message: msg,
      }));
      if (!_.isNil(error)) errors.push(error);
    };

    if (!_.isNil(_value) && !internals.typeCheck(_value)) {
      errors.push(new ValidateError({
        ...opts,
        rule: 'type',
        attrs: { type: internals.type },
      }));
    }

    if (!_.isNil(internals.validate)) {
      errors.push(...internals.validate(_value));
    }

    return errors;
  });

  const schema = {

    cast, validate,

    strict() {
      return builder({ transform: (v) => internals.typeCheck(v) ? v : undefined });
    },

    label(
      name: string
    ) {
      return builder({ label: name });
    },

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

    ...RulesLoader(common_rules),
    ...RulesLoader(rules),

  };

  return schema;
};
