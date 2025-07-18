const { internalAPI } = require('../utils/internalAPIClient');

class CalendarScheduler {
  constructor() {
    this.updateInterval = 5000; // 5 sekundi
    this.isRunning = false;
    this.intervalId = null;
  }

  async updateCalendars() {
    try {
      // Update calendar 1
      try {
        await internalAPI.get('/api/update-calendar/1');
      } catch (error) {
        console.error('Error updating calendar 1:', error.message);
      }

      // Update calendar 2
      try {
        await internalAPI.get('/api/update-calendar/2');
      } catch (error) {
        console.error('Error updating calendar 2:', error.message);
      }

    } catch (error) {
      console.error('Error in calendar auto-update:', error);
    }
  }

  start() {
    if (this.isRunning) {
      console.log('Calendar scheduler is already running');
      return;
    }

    console.log('Starting calendar auto-update scheduler (every 5 seconds)');
    this.isRunning = true;
    
    // Prvi update odmah
    this.updateCalendars();
    
    // Zatim svakih 5 sekundi
    this.intervalId = setInterval(() => {
      this.updateCalendars();
    }, this.updateInterval);
  }

  stop() {
    if (!this.isRunning) {
      console.log('Calendar scheduler is not running');
      return;
    }

    console.log('Stopping calendar auto-update scheduler');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setInterval(newInterval) {
    this.updateInterval = newInterval;
    
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMs: this.updateInterval,
      intervalSeconds: this.updateInterval / 1000
    };
  }
}

// Export singleton instance
const calendarScheduler = new CalendarScheduler();

module.exports = { calendarScheduler, CalendarScheduler };
