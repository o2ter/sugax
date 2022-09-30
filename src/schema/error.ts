//
//  error.ts
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
import locales from './locales';
import { replaceAll } from '../utils';

export class ValidateError extends Error {

  __proto__ = ValidateError.prototype;

  type: string;
  rule: string;
  path: string[];
  attrs: Record<string, string>;

  constructor(
    type: string,
    rule: string,
    path?: string[],
    attrs?: Record<string, string>,
  ) {
    super();
    this.type = type;
    this.rule = rule;
    this.path = path ?? [];
    this.attrs = attrs ?? {};
  }

  static get _locales() {
    return locales;
  }

  get locales() {

    return _.mapValues(locales, locale => {

      const params = { ...this.attrs, field: this.path.join('.') }
      let result: string = _.get(locale, `${this.type}.${this.rule}`) ?? _.get(locale, `mixed.${this.rule}`) ?? '';

      for (const [key, value] of Object.entries(params)) {
        result = replaceAll(result, '${' + key + '}', `${value}`);
      }

      return result;
    });
  }

  get message() {
    return this.locales.en;
  }
}
