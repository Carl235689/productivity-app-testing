// ========================================
// TEST SUITE FOR POPUP.JS LOGIC
// ========================================

const mockChrome = require('./mockChrome');

// Simulate popup.js logic
class PopupController {
  constructor() {
    this.REWARD_DURATION = 30 * 60 * 1000;
    this.taskInput = '';
    this.currentTask = '';
    this.rewardStatus = 'locked';
  }

  saveTask(task) {
    return new Promise((resolve) => {
      if (task.trim() === '') {
        resolve({ success: false, message: '⚠️ Please enter a task' });
        return;
      }

      mockChrome.storage.local.set({ currentTask: task }, () => {
        this.currentTask = task;
        console.log('✓ Task saved:', task);
        resolve({ success: true, message: '✓ Task saved!' });
      });
    });
  }

  loadTask() {
    return new Promise((resolve) => {
      mockChrome.storage.local.get(['currentTask'], (result) => {
        this.currentTask = result.currentTask || 'No task set';
        console.log('✓ Task loaded:', this.currentTask);
        resolve(this.currentTask);
      });
    });
  }

  completeTask() {
    return new Promise((resolve) => {
      // Send message to background to unlock reward
      mockChrome.runtime.sendMessage(
        { action: 'unlockReward' },
        (response) => {
          if (response && response.success) {
            this.updateRewardStatus();
            console.log('✓ Task completed, reward unlocked!');
            resolve({ success: true, message: '🎉 Reward unlocked for 30 minutes!' });
          }
        }
      );
    });
  }

  updateRewardStatus() {
    mockChrome.storage.local.get(['rewardUnlockedUntil'], (result) => {
      const unlockedUntil = result.rewardUnlockedUntil;
      const now = Date.now();

      if (unlockedUntil && now < unlockedUntil) {
        this.rewardStatus = 'unlocked';
        console.log('🎮 Reward Unlocked!');
      } else {
        this.rewardStatus = 'locked';
        console.log('🔒 Reward Locked');
      }
    });
  }

  getRemainingTime() {
    return new Promise((resolve) => {
      mockChrome.storage.local.get(['rewardUnlockedUntil'], (result) => {
        const unlockedUntil = result.rewardUnlockedUntil;
        const now = Date.now();

        if (!unlockedUntil || now >= unlockedUntil) {
          resolve(null);
        } else {
          const timeLeft = unlockedUntil - now;
          const minutes = Math.floor(timeLeft / 60000);
          const seconds = Math.floor((timeLeft % 60000) / 1000);
          resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      });
    });
  }
}

// ========================================
// TEST CASES
// ========================================

async function runTests() {
  console.log('\n========================================');
  console.log('🧪 POPUP CONTROLLER TESTS');
  console.log('========================================\n');

  const popup = new PopupController();

  // Test 1: Save empty task
  console.log('Test 1: Save empty task (should fail)');
  let result = await popup.saveTask('');
  console.log(result.message);

  // Test 2: Save valid task
  console.log('\nTest 2: Save valid task');
  result = await popup.saveTask('Complete project report');
  console.log(result.message);

  // Test 3: Load task
  console.log('\nTest 3: Load task from storage');
  const task = await popup.loadTask();
  console.log('Loaded task:', task);

  // Test 4: Complete task
  console.log('\nTest 4: Complete task and unlock reward');
  
  // First, we need to listen for the message
  mockChrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'unlockReward') {
      const unlockedUntil = Date.now() + (30 * 60 * 1000);
      mockChrome.storage.local.set({ rewardUnlockedUntil: unlockedUntil }, () => {
        sendResponse({ success: true });
      });
    }
  });

  await popup.completeTask();
  await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async

  // Test 5: Check reward status
  console.log('\nTest 5: Check reward status after unlock');
  popup.updateRewardStatus();

  // Test 6: Get remaining time
  console.log('\nTest 6: Get remaining reward time');
  const timeRemaining = await popup.getRemainingTime();
  console.log('⏱️ Time remaining:', timeRemaining);

  // Test 7: Simulate reward expiration
  console.log('\nTest 7: Simulate reward expiration');
  mockChrome.storage.local.set({ rewardUnlockedUntil: Date.now() - 1000 }, async () => {
    popup.updateRewardStatus();
    const timeRemaining = await popup.getRemainingTime();
    console.log('Time remaining after expiration:', timeRemaining || 'Expired');
  });

  await new Promise(resolve => setTimeout(resolve, 100)); // Wait for async

  console.log('\n========================================');
  console.log('✓ All popup tests completed!');
  console.log('========================================\n');
}

runTests();
