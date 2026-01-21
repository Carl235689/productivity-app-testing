// ========================================
// MOCK CHROME API
// ========================================
// This file mocks Chrome APIs for testing purposes

const mockChrome = {
  storage: {
    local: {
      data: {},
      get: function(keys, callback) {
        const result = {};
        if (Array.isArray(keys)) {
          keys.forEach(key => {
            if (this.data[key]) result[key] = this.data[key];
          });
        } else if (typeof keys === 'object') {
          Object.keys(keys).forEach(key => {
            result[key] = this.data[key] || keys[key];
          });
        }
        setTimeout(() => callback(result), 0);
      },
      set: function(items, callback) {
        Object.assign(this.data, items);
        console.log('✓ Storage updated:', items);
        if (callback) setTimeout(() => callback(), 0);
      },
      clear: function(callback) {
        this.data = {};
        if (callback) setTimeout(() => callback(), 0);
      }
    },
    onChanged: {
      listeners: [],
      addListener: function(callback) {
        this.listeners.push(callback);
      },
      fire: function(changes, areaName) {
        this.listeners.forEach(callback => callback(changes, areaName));
      }
    }
  },
  runtime: {
    onInstalled: {
      listeners: [],
      addListener: function(callback) {
        this.listeners.push(callback);
      },
      fire: function() {
        this.listeners.forEach(callback => callback());
      }
    },
    onMessage: {
      listeners: [],
      addListener: function(callback) {
        this.listeners.push(callback);
      },
      sendMessage: function(message, sender, callback) {
        this.listeners.forEach(listener => {
          listener(message, sender, callback);
        });
      }
    },
    sendMessage: function(message, callback) {
      chrome.runtime.onMessage.sendMessage(message, {}, callback);
    }
  }
};

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = mockChrome;
}

// Make it global
if (typeof global !== 'undefined') {
  global.chrome = mockChrome;
}
