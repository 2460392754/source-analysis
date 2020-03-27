/**
 * 运行队列
 * @param {Object} queue 任务队列
 * @param {Function} fn
 * @param {Function} cb 队列运行结束后的回调函数(callback)
 */
export function runQueue(queue, fn, cb) {
    const step = (index) => {
        // 队列运行结束，运行回调函数
        if (index >= queue.length) {
            cb();
        } else {
            // 跳过队列内容为假值的，例如：undefined
            if (queue[index]) {
                fn(queue[index], () => {
                    step(index + 1);
                });
            } else {
                step(index + 1);
            }
        }
    };

    step(0);
}
