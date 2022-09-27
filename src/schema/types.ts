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

export interface ISchema<Type> {

  default(value: Type): ISchema<Type>

  getDefault(): Type | undefined

}

type Internals<Type> = {
  default?: Type;
  rules: ((value: Type) => void)[];
  transforms: ((value: any) => Type)[];
}

export const schema_builder = <Type, P>(
  internals: P & Internals<Type>,
  extension: (internals: P & Internals<Type>, builder: (internals: P & Internals<Type>) => ISchema<Type>) => any
): ISchema<Type> => ({

  default(value: Type) {
    return schema_builder({ ...internals, default: value }, extension);
  },

  getDefault() {
    return internals.default;
  },

  ...extension(internals, (v) => schema_builder({ ...internals, ...v }, extension)),

});
