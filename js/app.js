// Pomodoro Timer Application

// Timer State
let timerInterval = null;
let totalSeconds = 25 * 60; // 25 minutes in seconds
let isRunning = false;
let isPaused = false;
let sessionCount = 0;
let currentMode = 'work'; // work, shortBreak, longBreak

// Timer Settings (in minutes)
const WORK_TIME = 25;
const SHORT_BREAK = 5;
const LONG_BREAK = 15;
const SESSIONS_UNTIL_LONG_BREAK = 4;

// DOM Elements
const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const sessionCountDisplay = document.getElementById('sessionCount');

// Initialize the app
function init() {
    updateTimerDisplay();
    updateSessionDisplay();
    
    // Add event listeners if elements exist
    if (startBtn) {
        startBtn.addEventListener('click', startTimer);
    }
    
    if (pauseBtn) {
        pauseBtn.addEventListener('click', pauseTimer);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetTimer);
    }

    // Handle contact form submission if on help page
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
    }
}

// Format time as MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update timer display
function updateTimerDisplay() {
    if (timerDisplay) {
        timerDisplay.textContent = formatTime(totalSeconds);
    }
}

// Update session count display
function updateSessionDisplay() {
    if (sessionCountDisplay) {
        sessionCountDisplay.textContent = sessionCount;
    }
}

// Update page title with timer
function updatePageTitle() {
    if (timerDisplay) {
        const timeText = formatTime(totalSeconds);
        const modeText = currentMode === 'work' ? '🍅' : '☕';
        document.title = `${modeText} ${timeText} - Pomodoro Timer`;
    }
}

// Start the timer
function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    isPaused = false;
    
    if (startBtn) {
        startBtn.textContent = 'Running...';
        startBtn.disabled = true;
    }
    
    timerInterval = setInterval(() => {
        if (totalSeconds > 0) {
            totalSeconds--;
            updateTimerDisplay();
            updatePageTitle();
        } else {
            // Timer completed
            timerComplete();
        }
    }, 1000);
}

// Pause the timer
function pauseTimer() {
    if (!isRunning) return;
    
    clearInterval(timerInterval);
    isRunning = false;
    isPaused = true;
    
    if (startBtn) {
        startBtn.textContent = 'Resume';
        startBtn.disabled = false;
    }
    
    if (pauseBtn) {
        pauseBtn.textContent = 'Paused';
    }
    
    setTimeout(() => {
        if (pauseBtn && !isRunning) {
            pauseBtn.textContent = 'Pause';
        }
    }, 1000);
}

// Reset the timer
function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    isPaused = false;
    
    // Reset to work mode
    currentMode = 'work';
    totalSeconds = WORK_TIME * 60;
    
    updateTimerDisplay();
    updatePageTitle();
    
    if (startBtn) {
        startBtn.textContent = 'Start';
        startBtn.disabled = false;
    }
}

// Timer completion handler
function timerComplete() {
    clearInterval(timerInterval);
    isRunning = false;
    
    // Play notification sound (browser notification)
    showNotification();
    
    if (currentMode === 'work') {
        sessionCount++;
        updateSessionDisplay();
        
        // Determine next mode
        if (sessionCount % SESSIONS_UNTIL_LONG_BREAK === 0) {
            startBreak('long');
        } else {
            startBreak('short');
        }
    } else {
        // Break completed, start work session
        startWork();
    }
}

// Start a work session
function startWork() {
    currentMode = 'work';
    totalSeconds = WORK_TIME * 60;
    updateTimerDisplay();
    updatePageTitle();
    
    if (startBtn) {
        startBtn.textContent = 'Start Work';
        startBtn.disabled = false;
    }
}

// Start a break
function startBreak(type) {
    currentMode = type === 'long' ? 'longBreak' : 'shortBreak';
    totalSeconds = (type === 'long' ? LONG_BREAK : SHORT_BREAK) * 60;
    updateTimerDisplay();
    updatePageTitle();
    
    if (startBtn) {
        startBtn.textContent = type === 'long' ? 'Start Long Break' : 'Start Short Break';
        startBtn.disabled = false;
    }
}

// Show browser notification
function showNotification() {
    const message = currentMode === 'work' 
        ? 'Work session complete! Time for a break.' 
        : 'Break is over! Time to get back to work.';
    
    // Try to use browser notifications
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro Timer', {
            body: message,
            icon: '/images/favicon.svg'
        });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        // Request permission
        Notification.requestPermission();
    }
    
    // Fallback: alert (only show if tab is visible)
    if (document.visibilityState === 'visible') {
        setTimeout(() => {
            alert(message);
        }, 100);
    }
}

// Handle contact form submission
function handleContactFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    
    // For demo purposes, just show an alert
    // In a real app, this would send data to a server
    alert(`Thank you, ${name}! Your message has been received.\n\nNote: This is a demo - no actual message was sent.`);
    
    // Reset form
    e.target.reset();
}

// Request notification permission on page load
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        // Wait a bit before asking to not be too aggressive
        setTimeout(() => {
            Notification.requestPermission();
        }, 3000);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Request notification permission after a delay
setTimeout(requestNotificationPermission, 2000);

// Update page title when timer is not running
updatePageTitle();
