// src/utils/apiMonitor.ts
class ApiMonitor {
  private requests: Map<string, number> = new Map();
  private lastLogTime = Date.now();
  
  logRequest(endpoint: string) {
    const now = Date.now();
    const key = `${endpoint}-${Math.floor(now / 1000)}`; // Group by second
    
    const count = this.requests.get(key) || 0;
    this.requests.set(key, count + 1);
    
    // Log every 10 seconds
    if (now - this.lastLogTime > 10000) {
      this.printReport();
      this.lastLogTime = now;
    }
  }
  
  printReport() {
    console.group('📊 API Request Report (last 10 seconds)');
    this.requests.forEach((count, key) => {
      const [endpoint, timestamp] = key.split('-');
      const time = new Date(parseInt(timestamp) * 1000).toLocaleTimeString();
      console.log(`${time} - ${endpoint}: ${count} requests`);
    });
    console.groupEnd();
    
    this.requests.clear();
  }
}

export const apiMonitor = new ApiMonitor();

// Usage in your hooks:
// apiMonitor.logRequest('/api/parlay/suggestions');
