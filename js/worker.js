let timerInterval = null;

self.onmessage = function(e) {
    const command = e.data;

    if (command === 'start') {
        // Якщо вже запущено, спочатку очищаємо, щоб не дублювати
        if (timerInterval) clearInterval(timerInterval);
        
        // Запускаємо інтервал
        timerInterval = setInterval(() => {
            self.postMessage('tick');
        }, 1000);
    } 
    else if (command === 'stop') {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = null;
    }
};