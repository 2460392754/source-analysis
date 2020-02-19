'use strict';

var utils = require('./../utils');

module.exports = utils.isStandardBrowserEnv()
    ? // 标准浏览器环境支持 document.cookie
      (function standardBrowserEnv() {
          return {
              write: function write(name, value, expires, path, domain, secure) {
                  var cookie = [];
                  cookie.push(name + '=' + encodeURIComponent(value));

                  // cookie过期时间
                  if (utils.isNumber(expires)) {
                      cookie.push('expires=' + new Date(expires).toGMTString());
                  }

                  // cookie限制路径
                  if (utils.isString(path)) {
                      cookie.push('path=' + path);
                  }

                  // cookie限制域名
                  if (utils.isString(domain)) {
                      cookie.push('domain=' + domain);
                  }

                  // 只支持https协议
                  if (secure === true) {
                      cookie.push('secure');
                  }

                  // cookie拼接
                  document.cookie = cookie.join('; ');
              },

              read: function read(name) {
                  var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
                  return match ? decodeURIComponent(match[3]) : null;
              },

              remove: function remove(name) {
                  this.write(name, '', Date.now() - 86400000);
              }
          };
      })()
    : // 非标准浏览器环境中不支持辅助, 例如（web-worker，react-native）
      (function nonStandardBrowserEnv() {
          return {
              write: function write() {},
              read: function read() {
                  return null;
              },
              remove: function remove() {}
          };
      })();
