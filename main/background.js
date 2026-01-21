// ========================================
// BACKGROUND.JS - Work Before Play Extension
// Service Worker for blocking/unblocking sites
// ========================================

const BLOCKED_SITES = [
  'youtube.com',
  'reddit.com',
  'twitch.tv',
  'instagram.com'
];

// ========================================
// Initialize on Extension Install
// ========================================
chrome.runtime.onInstalled.addListener(() => {
  console.log('Work Before Play extension installed');
  
  // Initialize storage with default values
  chrome.storage.local.get(['rewardUnlockedUntil'], (result) => {
    if (!result.rewardUnlockedUntil) {
      chrome.storage.local.set({ rewardUnlockedUntil: null });
    }
  });
  
  // Block sites by default
  updateBlockedSites();
});

// ========================================
// Listen for Messages from Popup
// ========================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'unlockReward') {
    // Calculate when reward should expire (30 minutes from now)
    const unlockedUntil = Date.now() + (30 * 60 * 1000);
    
    // Save to storage
    chrome.storage.local.set({ rewardUnlockedUntil: unlockedUntil }, () => {
      console.log('Reward unlocked until:', new Date(unlockedUntil).toLocaleTimeString());
      
      // Update site blocking status
      updateBlockedSites();
      
      // Send response back to popup
      sendResponse({ success: true });
      
      // Schedule re-blocking after reward expires
      scheduleReBlocking(unlockedUntil);
    });
    
    // Keep the message channel open for async response
    return true;
  }
});

// ========================================
// Update Blocked Sites Status
// ========================================
function updateBlockedSites() {
  chrome.storage.local.get(['rewardUnlockedUntil'], (result) => {
    const unlockedUntil = result.rewardUnlockedUntil;
    const now = Date.now();
    
    // Check if reward is still active
    const isRewardActive = unlockedUntil && now < unlockedUntil;
    
    if (isRewardActive) {
      console.log('🎮 Reward active - blocking sites disabled');
      // In a real implementation, remove block rules
    } else {
      console.log('🔒 Blocking restricted sites');
      // In a real implementation, apply block rules
    }
  });
}

// ========================================
// Schedule Re-blocking After Reward Expires
// ========================================
function scheduleReBlocking(unlockedUntil) {
  const now = Date.now();
  const timeUntilReblock = unlockedUntil - now;
  
  // Set timeout to re-block sites when reward expires
  setTimeout(() => {
    console.log('⏰ Reward time expired - re-blocking sites');
    updateBlockedSites();
    
    // Optionally notify user
    chrome.runtime.sendMessage(
      { action: 'rewardExpired' },
      () => {
        // Ignore errors if popup is not open
      }
    ).catch(() => {});
  }, timeUntilReblock);
}

// ========================================
// Monitor Storage Changes
// ========================================
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    if (changes.rewardUnlockedUntil) {
      console.log('Reward status changed:', changes.rewardUnlockedUntil.newValue);
      updateBlockedSites();
    }
    if (changes.currentTask) {
      console.log('Current task updated:', changes.currentTask.newValue);
    }
  }
});

// ========================================
// Periodically Check and Update Block Status
// ========================================
// Check every minute if reward has expired
setInterval(() => {
  chrome.storage.local.get(['rewardUnlockedUntil'], (result) => {
    const unlockedUntil = result.rewardUnlockedUntil;
    const now = Date.now();
    
    // If reward has expired, update blocking
    if (unlockedUntil && now >= unlockedUntil) {
      chrome.storage.local.set({ rewardUnlockedUntil: null });
      updateBlockedSites();
    }
  });
}, 60000); // Check every 60 seconds
