# 🍅 Pomodoro Timer

A web-based pomodoro timer that stays in your browser's tab and helps you with your productivity.

## Features

- ⏱️ **Focus Sessions** - 25-minute focused work sessions
- ☕ **Break Reminders** - Automatic short (5 min) and long (15 min) breaks
- 📊 **Session Tracking** - Keep track of completed pomodoro sessions
- 🔔 **Browser Notifications** - Get notified when sessions complete
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices
- 🎨 **Clean Interface** - Simple and distraction-free UI

## Project Structure

```
pomodoroWeb/
├── index.html          # Homepage with timer
├── about.html          # About page explaining Pomodoro Technique
├── help.html           # Help/Support page
├── css/
│   └── style.css       # Main stylesheet
├── js/
│   └── app.js          # Timer functionality
├── images/
│   ├── favicon.svg
│   ├── placeholder-about.svg
│   └── hero-illustration.svg
└── fonts/              # Custom fonts directory
```

## Getting Started

### Local Development

1. Clone this repository:
   ```bash
   git clone https://github.com/docholypancake/pomodoroWeb.git
   cd pomodoroWeb
   ```

2. Open `index.html` in your web browser:
   ```bash
   # On macOS
   open index.html
   
   # On Linux
   xdg-open index.html
   
   # On Windows
   start index.html
   ```

3. Or use a local server (recommended):
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (with http-server)
   npx http-server
   ```

4. Navigate to `http://localhost:8000` in your browser

### GitHub Pages Deployment

This site is ready to be deployed to GitHub Pages:

1. Go to your repository settings
2. Navigate to "Pages" section
3. Select the main branch as the source
4. Your site will be published at `https://docholypancake.github.io/pomodoroWeb/`

## How to Use

1. **Start a Session**: Click the "Start" button to begin a 25-minute work session
2. **Take Breaks**: After each session, you'll be prompted to take a 5-minute break
3. **Long Breaks**: After 4 work sessions, take a longer 15-minute break
4. **Track Progress**: Monitor your completed sessions in the session counter

## The Pomodoro Technique

The Pomodoro Technique is a time management method that uses a timer to break work into intervals:

1. Choose a task to work on
2. Set the timer for 25 minutes
3. Work on the task until the timer rings
4. Take a 5-minute break
5. After 4 pomodoros, take a longer 15-minute break

## Customization

### Changing Timer Durations

Edit the constants in `js/app.js`:

```javascript
const WORK_TIME = 25;          // Work session in minutes
const SHORT_BREAK = 5;         // Short break in minutes
const LONG_BREAK = 15;         // Long break in minutes
const SESSIONS_UNTIL_LONG_BREAK = 4;  // Sessions before long break
```

### Styling

Modify CSS variables in `css/style.css`:

```css
:root {
    --primary-color: #e74c3c;    /* Main theme color */
    --secondary-color: #3498db;  /* Secondary color */
    /* ... other variables */
}
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the Pomodoro Technique developed by Francesco Cirillo
- Built with vanilla HTML, CSS, and JavaScript
