let timerInterval;
let remainingSeconds;

self.onmessage = function(e) {
    const { action, seconds } = e.data;

    if (action === 'start') {
        remainingSeconds = seconds;
        timerInterval = setInterval(() => {
            if (remainingSeconds > 0) {
                remainingSeconds--;
                self.postMessage({ remainingSeconds });
            } else {
                clearInterval(timerInterval);
                self.postMessage({ action: 'complete' });
            }
        }, 1000);
    } else if (action === 'stop') {
        clearInterval(timerInterval);
    }
};