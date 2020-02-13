/*       */

import { History } from './base';
import { NavigationDuplicated } from './errors';
import { isExtendedError } from '../util/warn';

export class AbstractHistory extends History {
    constructor(router, base) {
        super(router, base);
        this.stack = [];
        this.index = -1;
    }

    push(location, onComplete, onAbort) {
        this.transitionTo(
            location,
            (route) => {
                this.stack = this.stack.slice(0, this.index + 1).concat(route);
                this.index++;
                onComplete && onComplete(route);
            },
            onAbort
        );
    }

    replace(location, onComplete, onAbort) {
        this.transitionTo(
            location,
            (route) => {
                this.stack = this.stack.slice(0, this.index).concat(route);
                onComplete && onComplete(route);
            },
            onAbort
        );
    }

    go(n) {
        const targetIndex = this.index + n;
        if (targetIndex < 0 || targetIndex >= this.stack.length) {
            return;
        }
        const route = this.stack[targetIndex];
        this.confirmTransition(
            route,
            () => {
                this.index = targetIndex;
                this.updateRoute(route);
            },
            (err) => {
                if (isExtendedError(NavigationDuplicated, err)) {
                    this.index = targetIndex;
                }
            }
        );
    }

    getCurrentLocation() {
        const current = this.stack[this.stack.length - 1];
        return current ? current.fullPath : '/';
    }

    ensureURL() {
        // noop
    }
}
