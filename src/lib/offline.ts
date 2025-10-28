// IndexedDB wrapper for offline message queue and cache

interface QueuedMessage {
  id?: number;
  conversation_id: string;
  sender_id: string;
  text: string;
  modality: string;
  timestamp: number;
  status: 'pending' | 'failed';
  media_url?: string;
  media_type?: string;
}

class OfflineQueue {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'UniComDB';
  private readonly DB_VERSION = 1;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('messageQueue')) {
          db.createObjectStore('messageQueue', { keyPath: 'id', autoIncrement: true });
        }
        
        if (!db.objectStoreNames.contains('messageCache')) {
          db.createObjectStore('messageCache', { keyPath: 'conversationId' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async addToQueue(message: Omit<QueuedMessage, 'id' | 'timestamp' | 'status'>): Promise<number> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messageQueue'], 'readwrite');
      const store = transaction.objectStore('messageQueue');
      const request = store.add({
        ...message,
        timestamp: Date.now(),
        status: 'pending'
      });
      
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getQueue(): Promise<QueuedMessage[]> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messageQueue'], 'readonly');
      const store = transaction.objectStore('messageQueue');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromQueue(id: number): Promise<void> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messageQueue'], 'readwrite');
      const store = transaction.objectStore('messageQueue');
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateQueueStatus(id: number, status: 'pending' | 'failed'): Promise<void> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messageQueue'], 'readwrite');
      const store = transaction.objectStore('messageQueue');
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const message = getRequest.result;
        if (message) {
          message.status = status;
          const updateRequest = store.put(message);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async cacheMessages(conversationId: string, messages: any[]): Promise<void> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messageCache'], 'readwrite');
      const store = transaction.objectStore('messageCache');
      const request = store.put({ 
        conversationId, 
        messages, 
        cachedAt: Date.now() 
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedMessages(conversationId: string): Promise<any[]> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messageCache'], 'readonly');
      const store = transaction.objectStore('messageCache');
      const request = store.get(conversationId);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.messages : []);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearCache(): Promise<void> {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messageCache'], 'readwrite');
      const store = transaction.objectStore('messageCache');
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineQueue = new OfflineQueue();
