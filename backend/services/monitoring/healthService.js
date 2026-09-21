/**
 * Health Service (Phase 5 — Production Readiness)
 * Provides health monitoring for the application, database, and AI services.
 * Follows SOLID principles — this module is solely responsible for health checks.
 */
const mongoose = require('mongoose');

class HealthService {
  constructor() {
    this.stats = {
      totalChecks: 0,
      totalFailures: 0,
      startTime: new Date(),
    };
    this.lastCheck = null;
    this.checkInterval = 60 * 1000; // 1 minute
    this._startHealthMonitor();
  }

  /**
   * Get overall health status
   * @returns {Promise<Object>} - Health report
   */
  async getHealth() {
    this.stats.totalChecks += 1;

    const [dbStatus, memoryStatus, uptime] = await Promise.all([
      this._checkDatabase(),
      this._checkMemory(),
      Promise.resolve(this._getUptime()),
    ]);

    const checks = {
      database: dbStatus,
      memory: memoryStatus,
      uptime,
    };

    const healthy = dbStatus.healthy;
    if (!healthy) this.stats.totalFailures += 1;

    this.lastCheck = {
      timestamp: new Date(),
      healthy,
      checks,
    };

    return {
      success: true,
      data: {
        status: healthy ? 'healthy' : 'degraded',
        healthy,
        checks,
        timestamp: new Date().toISOString(),
        uptimeSeconds: uptime.seconds,
      },
    };
  }

  /**
   * Check database connectivity
   * @returns {Promise<Object>} - Database status
   */
  async _checkDatabase() {
    try {
      const state = mongoose.connection.readyState;
      // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      };
      const status = states[state] || 'unknown';

      if (state !== 1) {
        return { healthy: false, status, message: `Database is ${status}` };
      }

      return { healthy: true, status, latency: 'ok' };
    } catch (error) {
      return { healthy: false, status: 'error', message: error.message };
    }
  }

  /**
   * Check memory usage
   * @returns {Promise<Object>} - Memory status
   */
  async _checkMemory() {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024 * 10) / 10;
    const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024 * 10) / 10;
    const rssMB = Math.round(used.rss / 1024 / 1024 * 10) / 10;

    // Alert if heap usage exceeds 85% of heap total
    const heapRatio = heapTotalMB > 0 ? heapUsedMB / heapTotalMB : 0;
    const healthy = heapRatio < 0.85;

    return {
      healthy,
      heapUsedMB,
      heapTotalMB,
      rssMB,
      heapRatio: Math.round(heapRatio * 100) / 100,
      message: healthy ? 'Memory usage within limits' : 'High memory usage detected',
    };
  }

  /**
   * Get process uptime
   * @returns {Object} - Uptime info
   */
  _getUptime() {
    const seconds = Math.floor(process.uptime());
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return {
      seconds,
      formatted: `${days}d ${hours}h ${minutes}m`,
    };
  }

  /**
   * Run periodic health checks and log issues
   */
  _startHealthMonitor() {
    this._monitorTimer = setInterval(async () => {
      const result = await this.getHealth().catch(() => null);
      if (result && !result.data.healthy) {
        console.warn(`Health check failed: ${JSON.stringify(result.data.checks)}`);
      }
    }, this.checkInterval);
    this._monitorTimer.unref?.();
  }

  /**
   * Get health service statistics
   */
  getStats() {
    return { ...this.stats, lastCheck: this.lastCheck };
  }
}

// Export singleton
const healthService = new HealthService();

module.exports = healthService;
module.exports.HealthService = HealthService;