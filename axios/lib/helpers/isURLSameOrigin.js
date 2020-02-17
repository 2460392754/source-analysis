'use strict';

var utils = require('./../utils');

module.exports = utils.isStandardBrowserEnv()
    ? // 标准浏览器环境
      (function standardBrowserEnv() {
          // 是否是ie浏览器
          var msie = /(msie|trident)/i.test(navigator.userAgent);
          var urlParsingNode = document.createElement('a');
          var originURL;

          /**
           * 获取`window.location`上面的属性
           *
           * @param {String} url 需要解析的URL
           * @returns {Object}
           */
          function resolveURL(url) {
              var href = url;

              // IE浏览器需要设置2遍(暂时没找到解释的文章和资料)
              if (msie) {
                  urlParsingNode.setAttribute('href', href);
                  href = urlParsingNode.href;
              }

              urlParsingNode.setAttribute('href', href);

              // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
              return {
                  href: urlParsingNode.href,
                  protocol: urlParsingNode.protocol
                      ? urlParsingNode.protocol.replace(/:$/, '')
                      : '',
                  host: urlParsingNode.host,
                  search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
                  hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
                  hostname: urlParsingNode.hostname,
                  port: urlParsingNode.port,
                  pathname:
                      urlParsingNode.pathname.charAt(0) === '/'
                          ? urlParsingNode.pathname
                          : '/' + urlParsingNode.pathname
              };
          }

          originURL = resolveURL(window.location.href);

          /**
           * 判断`requestURL`和当前环境是否是同源
           *
           * @param {String} requestURL 需要测试的URL
           * @returns {boolean} 是否同源
           */
          return function isURLSameOrigin(requestURL) {
              var parsed = utils.isString(requestURL) ? resolveURL(requestURL) : requestURL;
              return parsed.protocol === originURL.protocol && parsed.host === originURL.host;
          };
      })()
    : // 非标准浏览器环境
      (function nonStandardBrowserEnv() {
          return function isURLSameOrigin() {
              return true;
          };
      })();
