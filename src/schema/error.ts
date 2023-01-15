//
//  error.ts
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
import locales from './locales';

type ValidateErrorOptions = {
  type: string,
  rule: string,
  path?: string[],
  label?: string,
  attrs?: Record<string, string>,
  message?: string,
};

export class ValidateError extends Error {

  options: ValidateErrorOptions;

  constructor(options: ValidateErrorOptions) {
    super();
    Object.setPrototypeOf(this, ValidateError.prototype);
    this.options = options;
  }

  static get _locales() {
    return locales;
  }

  get type() {
    return this.options.type;
  }
  get rule() {
    return this.options.rule;
  }
  get path() {
    return this.options.path ?? [];
  }
  get label() {
    return this.options.label;
  }
  get attrs() {
    return this.options.attrs;
  }

  get locales() {

    return _.mapValues(locales, locale => {
      const params: Record<string, string> = {
        ...this.attrs,
        field: this.label ?? this.path.join('.'),
      }
      const pattern: string = _.get(locale, `${this.type}.${this.rule}`) ?? _.get(locale, `mixed.${this.rule}`) ?? '';
      return pattern.replace(/\$\{\s*(\w+)\s*\}/g, (_, key) => `${params[key]}`);
    });
  }

  get message() {
    return this.options.message ?? this.locales.en;
  }
}
