//
//  i18n.js
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
import React, { useEffect } from 'react';

const I18nContext = React.createContext({ preferredLocale: 'en', setPreferredLocale: () => {} });

export const I18nProvider = React.forwardRef(({
    preferredLocale = 'en',
    onChange = () => {},
    children
}, forwardRef) => {
    
    const [_preferredLocale, setPreferredLocale] = React.useState(preferredLocale);

    useEffect(() => { onChange(_preferredLocale); }, [_preferredLocale]);
    
    return <I18nContext.Provider ref={forwardRef} value={{ preferredLocale: _preferredLocale, setPreferredLocale }}>{children}</I18nContext.Provider>;
});

const _lang_map = {
    "zh-cn": "zh-hans",
    "zh-hk": "zh-hant",
    "zh-tw": "zh-hant",
};

function replaceAll(string, pattern, replacement) {

    if (!_.isString(string)) return;

    let idx = string.lastIndexOf(pattern);

    while(idx !== -1) {
        string = string.substring(0, idx) + replacement + string.substring(idx + pattern.length);
        idx = string.lastIndexOf(pattern);
    } 
    
    return string;
}

function getLanguagePartFromCode(code) {
    if (!_.isString(code) || code.indexOf('-') < 0) return code;
    return code.split('-')[0];
}

function getScriptPartFromCode(code) {
    if (!_.isString(code) || code.indexOf('-') < 0) return;
    return code.split('-')[1];
}

function _useUserLocales(i18nState) {

    const locales = [];

    if (i18nState?.preferredLocale) {
        
        locales.push({
            languageCode: getLanguagePartFromCode(i18nState.preferredLocale),
            scriptCode: getScriptPartFromCode(i18nState.preferredLocale),
        });
    }

    if (global.navigator) {

        const languages = navigator.languages;
        const language = navigator.language;

        if (languages) {

            for (const language of languages) {
            
                locales.push({
                    languageCode: getLanguagePartFromCode(language),
                    scriptCode: getScriptPartFromCode(language),
                });
            }

        } else if (language) {
            
            locales.push({
                languageCode: getLanguagePartFromCode(language),
                scriptCode: getScriptPartFromCode(language),
            });
        }
    }

    return locales;
}

export const useUserLocales = () => _useUserLocales(React.useContext(I18nContext));

export function setPreferredLocale(locale) {

    const { setPreferredLocale } = React.useContext(I18nContext);
    
    setPreferredLocale(locale);
}

function _localize(strings, params, i18nState, toString) {

    if (_.isEmpty(strings)) return;

    const default_locales = [
        { languageCode: 'en' },
    ]
    
    for (const locale of _useUserLocales(i18nState).concat(default_locales)) {
    
        if (!_.isEmpty(locale.languageCode) && !_.isEmpty(locale.scriptCode)) {

            let tag = `${locale.languageCode}-${locale.scriptCode}`.toLowerCase();
            tag = _lang_map[tag] ?? tag;

            if (!_.isNil(toString(strings[tag]))) {

                let result = toString(strings[tag]);

                if (params && _.isString(result)) {
                    for (const [key, value] of Object.entries(params)) {
                        result = replaceAll(result, '${' + key + '}', `${value}`);
                    }
                }

                return result;
            }
        }

        if (!_.isEmpty(locale.languageCode)) {

            const languageCode = locale.languageCode.toLowerCase();
            
            if (!_.isNil(toString(strings[languageCode]))) {

                let result = toString(strings[languageCode]);

                if (params && _.isString(result)) {
                    for (const [key, value] of Object.entries(params)) {
                        result = replaceAll(result, '${' + key + '}', `${value}`);
                    }
                }

                return result;
            }
        }
    }
}

export const useLocalize = ({...strings}, params = {}) => _localize(strings, params, React.useContext(I18nContext), (x) => { return x; });

export const LocalizationStrings = ({...strings}) => ({

    useLocalize() {
        
        const i18nState = React.useContext(I18nContext);
        
        return {
            
            string(key, params = {}) {
                return _localize(strings, params, i18nState, (x) => { return x ? x[key] : null; }) ?? key;
            }
        }
    }
});
