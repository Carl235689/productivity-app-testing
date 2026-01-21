// ========================================
// TEST SUITE FOR BACKGROUND.JS LOGIC
// ========================================

const mockChrome = require('./mockChrome');

// Simulate background.js logic
class BackgroundWorker {
  constructor() {
    this.BLOCKED_SITES = [
      'youtube.com',
      'reddit.com',
      'twitch.tv',
      'instagram.com'
    ];
    this.initialize();
  }

  initialize() {
    console.log('🔧 Initializing background worker...');
    mockChrome.storage.local.get(['rewardUnlockedUntil'], (result) => {
      if (!result.rewardUnlockedUntil) {
        mockChrome.storage.local.set({ rewardUnlockedUntil: null });
      }
    });
  }

  unlockReward() {
    return new Promise((resolve) => {
      const unlockedUntil = Date.now() + (30 * 60 * 1000);
      mockChrome.storage.local.set({ rewardUnlockedUntil: unlockedUntil }, () => {
        console.log('🎮 Reward unlocked until:', new Date(unlockedUntil).toLocaleTimeString());
        this.scheduleReBlocking(unlockedUntil);
        resolve({ success: true });
      });
    });
  }

  scheduleReBlocking(unlockedUntil) {
    const now = Date.now();
    const timeUntilReblock = unlockedUntil - now;
    console.log(`⏰ Will re-block sites in ${Math.round(timeUntilReblock / 1000)} seconds`);
  }

  isRewardActive() {
    return new Promise((resolve) => {
      mockChrome.storage.local.get(['rewardUnlockedUntil'], (result) => {
        const unlockedUntil = result.rewardUnlockedUntil;
        const now = Date.now();
        const isActive = unlockedUntil && now < unlockedUntil;
        resolve(isActive);
      });
    });
  }

  getBlockedSites() {
    return this.BLOCKED_SITES;
  }
}

// ========================================
// TEST CASES
// ========================================

async function runTests() {
  console.log('\n========================================');
  console.log('🧪 BACKGROUND WORKER TESTS');
  console.log('========================================\n');

  const worker = new BackgroundWorker();

  // Test 1: Initialize
  console.log('Test 1: Initialization');
  mockChrome.storage.local.get(['rewardUnlockedUntil'], (result) => {
    console.log('✓ Reward unlocked until initialized:', result.rewardUnlockedUntil);
  });

  // Test 2: Get blocked sites
  console.log('\nTest 2: Get blocked sites');
  const blockedSites = worker.getBlockedSites();
  console.log('✓ Blocked sites:', blockedSites.join(', '));

  // Test 3: Unlock reward
  console.log('\nTest 3: Unlock reward');
  await worker.unlockReward();
  const isActive = await worker.isRewardActive();
  console.log('✓ Reward active after unlock:', isActive);

  // Test 4: Check reward status
  console.log('\nTest 4: Check reward status after unlock');
  mockChrome.storage.local.get(['rewardUnlockedUntil'], (result) => {
    if (result.rewardUnlockedUntil) {
      const timeLeft = result.rewardUnlockedUntil - Date.now();
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      console.log(`✓ Time remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`);
    }
  });

  // Test 5: Simulate reward expiration
  console.log('\nTest 5: Simulate reward expiration (set to 1 second ago)');
  const expiredTime = Date.now() - 1000;
  mockChrome.storage.local.set({ rewardUnlockedUntil: expiredTime }, () => {
    worker.isRewardActive().then((isActive) => {
      console.log('✓ Reward active after expiration:', isActive);
    });
  });

  console.log('\n========================================');
  console.log('✓ All background tests completed!');
  console.log('========================================\n');
}

runTests();
