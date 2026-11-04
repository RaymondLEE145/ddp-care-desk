/* CareDesk — screenshot OCR (Tesseract.js loaded lazily from CDN) */
(function () {
  'use strict';

  var CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  var worker = null;
  var progressHandler = null;
  var libPromise = null;

  function loadScript(src) {
    if (libPromise) return libPromise;
    libPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function () { resolve(true); };
      s.onerror = function () { libPromise = null; reject(new Error('OCR 引擎加载失败，请检查网络后重试，或直接粘贴客户文字')); };
      document.head.appendChild(s);
    });
    return libPromise;
  }

  function fileToCanvas(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var max = 2000;
          var scale = Math.min(1, max / Math.max(img.width, img.height));
          var w = Math.round(img.width * scale);
          var h = Math.round(img.height * scale);
          var canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          var ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, w, h);

          var data = ctx.getImageData(0, 0, w, h);
          var px = data.data, sum = 0, n = 0;
          for (var i = 0; i < px.length; i += 16) { sum += px[i]; n++; }
          var avg = sum / Math.max(1, n);
          var invert = avg < 90;
          for (var j = 0; j < px.length; j += 4) {
            var g = 0.299 * px[j] + 0.587 * px[j + 1] + 0.114 * px[j + 2];
            g = Math.max(0, Math.min(255, (g - 128) * 1.22 + 128));
            if (invert) g = 255 - g;
            px[j] = px[j + 1] = px[j + 2] = g;
          }
          ctx.putImageData(data, 0, 0);
          URL.revokeObjectURL(url);
          resolve(canvas);
        } catch (e) { URL.revokeObjectURL(url); reject(e); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('图片读取失败，请换一张截图')); };
      img.src = url;
    });
  }

  async function ensureWorker() {
    await loadScript(CDN);
    if (worker) return worker;
    if (!window.Tesseract) throw new Error('OCR 引擎不可用');
    worker = await window.Tesseract.createWorker('eng+chi_sim', 1, {
      logger: function (m) { if (progressHandler) progressHandler(m); }
    });
    return worker;
  }

  function cleanText(text) {
    var s = String(text || '');
    for (var i = 0; i < 3; i++) {
      s = s.replace(/([\u4e00-\u9fa5])\s+(?=[\u4e00-\u9fa5])/g, '$1')
           .replace(/([\u4e00-\u9fa5])\s+([，。！？、；：（）《》“”‘’])/g, '$1$2')
           .replace(/([，。！？、；：（）《》“”‘’])\s+(?=[\u4e00-\u9fa5])/g, '$1');
    }
    return s.replace(/\n{3,}/g, '\n\n').trim();
  }

  async function recognize(file, onProgress) {
    progressHandler = onProgress || function () {};
    var canvas = await fileToCanvas(file);
    var w = await ensureWorker();
    var result = await w.recognize(canvas);
    return cleanText(result && result.data && result.data.text);
  }

  function shutdown() {
    if (worker) { try { worker.terminate(); } catch (e) {} worker = null; }
    progressHandler = null;
  }

  window.DDCOcr = { recognize: recognize, shutdown: shutdown };
})();
