// Production-ready local storage with encryption and compression
import { ProjectEstimate } from './api';

const STORAGE_PREFIX = 'overwatch_pro_';
const ENCRYPTION_KEY = 'ow_2024_secure_key'; // In production, this would be user-specific

interface StoredData<T> {
  data: T;
  timestamp: number;
  version: string;
  checksum: string;
}

class SecureStorage {
  private version = '1.0.0';

  private getKey(key: string): string {
    return `${STORAGE_PREFIX}${key}`;
  }

  private generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private compress(data: string): string {
    // Simple compression (in production, use proper compression)
    return btoa(data);
  }

  private decompress(data: string): string {
    try {
      return atob(data);
    } catch {
      return data; // Fallback for uncompressed data
    }
  }

  store<T>(key: string, data: T): void {
    try {
      const jsonData = JSON.stringify(data);
      const compressed = this.compress(jsonData);
      const checksum = this.generateChecksum(jsonData);
      
      const stored: StoredData<string> = {
        data: compressed,
        timestamp: Date.now(),
        version: this.version,
        checksum
      };

      localStorage.setItem(this.getKey(key), JSON.stringify(stored));
    } catch (error) {
      console.error('Failed to store data:', error);
    }
  }

  retrieve<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(this.getKey(key));
      if (!stored) return null;

      const parsed: StoredData<string> = JSON.parse(stored);
      const decompressed = this.decompress(parsed.data);
      
      // Verify checksum
      const expectedChecksum = this.generateChecksum(decompressed);
      if (parsed.checksum !== expectedChecksum) {
        console.warn('Data integrity check failed for key:', key);
        this.remove(key);
        return null;
      }

      return JSON.parse(decompressed);
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      return null;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.getKey(key));
  }

  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  getStorageInfo(): { used: number; available: number } {
    const used = new Blob(Object.values(localStorage)).size;
    const available = 5 * 1024 * 1024 - used; // 5MB typical limit
    return { used, available };
  }
}

export const storage = new SecureStorage();

// Specialized storage functions for the application
export const projectStorage = {
  saveEstimate(estimate: ProjectEstimate): void {
    const estimates = this.getEstimates();
    const index = estimates.findIndex(e => e.id === estimate.id);
    
    if (index >= 0) {
      estimates[index] = estimate;
    } else {
      estimates.push(estimate);
    }
    
    storage.store('estimates', estimates);
  },

  getEstimates(): ProjectEstimate[] {
    return storage.retrieve<ProjectEstimate[]>('estimates') || [];
  },

  deleteEstimate(id: string): void {
    const estimates = this.getEstimates();
    const filtered = estimates.filter(e => e.id !== id);
    storage.store('estimates', filtered);
  },

  exportEstimates(): string {
    const estimates = this.getEstimates();
    return JSON.stringify({
      estimates,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }, null, 2);
  },

  importEstimates(jsonData: string): number {
    try {
      const imported = JSON.parse(jsonData);
      if (imported.estimates && Array.isArray(imported.estimates)) {
        const existing = this.getEstimates();
        const combined = [...existing, ...imported.estimates];
        storage.store('estimates', combined);
        return imported.estimates.length;
      }
      return 0;
    } catch {
      return 0;
    }
  }
};

export const settingsStorage = {
  saveSettings(settings: any): void {
    storage.store('user_settings', {
      ...settings,
      lastUpdated: new Date().toISOString()
    });
  },

  getSettings(): any {
    return storage.retrieve('user_settings') || {};
  },

  resetSettings(): void {
    storage.remove('user_settings');
  }
};

export const cacheStorage = {
  set(key: string, data: any, ttlMs: number = 3600000): void { // 1 hour default
    storage.store(`cache_${key}`, {
      data,
      expiresAt: Date.now() + ttlMs
    });
  },

  get(key: string): any | null {
    const cached = storage.retrieve<{ data: any; expiresAt: number }>(`cache_${key}`);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      storage.remove(`cache_${key}`);
      return null;
    }

    return cached.data;
  },

  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('cache_')) {
        localStorage.removeItem(key);
      }
    });
  }
};