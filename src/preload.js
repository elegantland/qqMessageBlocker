// preload.js
window.onLoad = function() {
  console.log('MessageBlocker preload loaded');
  
  // 安全地尝试设置编码
  try {
    if (typeof process !== 'undefined') {
      process.env.LANG = 'zh_CN.UTF-8';
      
      if (process.stdout && process.stdout.setEncoding) {
        process.stdout.setEncoding('utf8');
      }
      
      if (process.stderr && process.stderr.setEncoding) {
        process.stderr.setEncoding('utf8');
      }
    }
  } catch (error) {
    console.error('设置编码时发生错误:', error);
  }
};
window.onUnload = function() {
  console.log('MessageBlocker preload unloaded');
};