//
//  rules.ts
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
import { ValidateError } from '../error';

const email_pattern = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const url_pattern = /^((https?|ftp):)?\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
const uuid_pattern = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

export const notEmpty = (
  value: any,
  error: (attrs: Record<string, string>) => ValidateError,
) => _.isString(value) && !_.isEmpty(value) ? undefined : error({});

export const min = (
  value: any,
  error: (attrs: Record<string, string>) => ValidateError,
  min: number
) => _.isString(value) && value.length >= min ? undefined : error({ min: `${min}` });

export const max = (
  value: any,
  error: (attrs: Record<string, string>) => ValidateError,
  max: number
) => _.isString(value) && value.length <= max ? undefined : error({ max: `${max}` });

export const length = (
  value: any,
  error: (attrs: Record<string, string>) => ValidateError,
  length: number
) => _.isString(value) && value.length === length ? undefined : error({ length: `${length}` });

export const matches = (
  value: any,
  error: (attrs: Record<string, string>) => ValidateError,
  regex: RegExp
) => _.isString(value) && regex.test(value) ? undefined : error({ regex: `${regex}` });

export const email = (
  value: any,
  error: (attrs: Record<string, string>) => ValidateError,
) => _.isString(value) && email_pattern.test(value) ? undefined : error({});

export const url = (
  value: any,
  error: (attrs: Record<string, string>) => ValidateError,
) => _.isString(value) && url_pattern.test(value) ? undefined : error({});

export const uuid = (
  value: any,
  error: (attrs: Record<string, string>) => ValidateError,
) => _.isString(value) && uuid_pattern.test(value) ? undefined : error({});

export const trim = (
  value: any,
  error: (attrs: Record<string, string>) => ValidateError,
) => _.isString(value) && value === value.trim() ? undefined : error({});

export const lowercase = (
  value: any,
  error: (attrs: Record<string, string>) => ValidateError,
) => _.isString(value) && value === value.toLowerCase() ? undefined : error({});

export const uppercase = (
  value: any,
  error: (attrs: Record<string, string>) => ValidateError,
) => _.isString(value) && value === value.toUpperCase() ? undefined : error({});

export const oneOf = (
  value: any,
  error: (attrs: Record<string, string>) => ValidateError,
  values: string[]
) => _.isString(value) && values.includes(value) ? undefined : error({ values: `${values}` });

export const notOneOf = (
  value: any,
  error: (attrs: Record<string, string>) => ValidateError,
  values: string[]
) => _.isString(value) && !values.includes(value) ? undefined : error({ values: `${values}` });
