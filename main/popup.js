// ========================================
// POPUP.JS - Work Before Play Extension
// ========================================

const REWARD_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// DOM Elements
const taskInput = document.getElementById('task-input');
const saveTaskBtn = document.getElementById('save-task-btn');
const currentTaskDisplay = document.getElementById('current-task');
const doneBtn = document.getElementById('done-btn');
const completionMessage = document.getElementById('completion-message');
const rewardStatus = document.getElementById('reward-status');
const rewardTimer = document.getElementById('reward-timer');
const rewardSection = document.getElementById('reward-section');

// ========================================
// Load and Display Data on Popup Open
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  loadTaskFromStorage();
  updateRewardStatus();
  startRewardTimer();
});

// ========================================
// Save Task
// ========================================
saveTaskBtn.addEventListener('click', () => {
  const task = taskInput.value.trim();
  
  if (task === '') {
    completionMessage.textContent = '⚠️ Please enter a task';
    completionMessage.style.color = '#ff6b6b';
    return;
  }
  
  // Save to Chrome storage
  chrome.storage.local.set({ currentTask: task }, () => {
    currentTaskDisplay.textContent = task;
    taskInput.value = '';
    completionMessage.textContent = '✓ Task saved!';
    completionMessage.style.color = '#51cf66';
    
    // Clear message after 2 seconds
    setTimeout(() => {
      completionMessage.textContent = '';
    }, 2000);
  });
});

// ========================================
// Handle "Done!" Button Click
// ========================================
doneBtn.addEventListener('click', () => {
  // Send message to background script to unlock reward
  chrome.runtime.sendMessage(
    { action: 'unlockReward' },
    (response) => {
      if (response && response.success) {
        completionMessage.textContent = '🎉 Reward unlocked for 30 minutes!';
        completionMessage.style.color = '#51cf66';
        
        updateRewardStatus();
        startRewardTimer();
        
        // Clear message after 3 seconds
        setTimeout(() => {
          completionMessage.textContent = '';
        }, 3000);
      }
    }
  );
});

// ========================================
// Load Task from Storage
// ========================================
function loadTaskFromStorage() {
  chrome.storage.local.get(['currentTask'], (result) => {
    if (result.currentTask) {
      currentTaskDisplay.textContent = result.currentTask;
    } else {
      currentTaskDisplay.textContent = 'No task set';
    }
  });
}

// ========================================
// Update Reward Status Display
// ========================================
function updateRewardStatus() {
  chrome.storage.local.get(['rewardUnlockedUntil'], (result) => {
    const unlockedUntil = result.rewardUnlockedUntil;
    const now = Date.now();
    
    if (unlockedUntil && now < unlockedUntil) {
      rewardStatus.textContent = '🎮 Reward Unlocked!';
      rewardStatus.classList.remove('status-locked');
      rewardStatus.classList.add('status-unlocked');
      rewardSection.classList.add('active');
    } else {
      rewardStatus.textContent = '🔒 Reward Locked';
      rewardStatus.classList.remove('status-unlocked');
      rewardStatus.classList.add('status-locked');
      rewardSection.classList.remove('active');
    }
  });
}

// ========================================
// Display Reward Timer
// ========================================
function startRewardTimer() {
  // Update every second
  const timerInterval = setInterval(() => {
    chrome.storage.local.get(['rewardUnlockedUntil'], (result) => {
      const unlockedUntil = result.rewardUnlockedUntil;
      const now = Date.now();
      
      if (!unlockedUntil || now >= unlockedUntil) {
        // Reward has expired
        rewardTimer.textContent = '';
        updateRewardStatus();
        clearInterval(timerInterval);
      } else {
        // Calculate remaining time
        const timeLeft = unlockedUntil - now;
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        
        rewardTimer.textContent = `⏱️ Time remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    });
  }, 1000);
}

// Refresh status when popup is opened
window.addEventListener('focus', () => {
  loadTaskFromStorage();
  updateRewardStatus();
});
