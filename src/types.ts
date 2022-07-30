
import React from 'react';

export interface IState<T = any> {
    get current(): T
    setValue(value: React.SetStateAction<T>): void
}
