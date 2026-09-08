import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';

@Injectable({
  providedIn: 'root'
})
export class RealtimeNotificationService {
  private readonly wsUrl = 'ws://localhost:9090/ws';

  private client: Client | null = null;
  private connected = false;

  private readonly accessNotificationSubject = new BehaviorSubject<any | null>(null);
  readonly accessNotification$ = this.accessNotificationSubject.asObservable();

  private readonly medicalProfileUpdateSubject = new BehaviorSubject<any | null>(null);
  readonly medicalProfileUpdate$ = this.medicalProfileUpdateSubject.asObservable();

  constructor(private readonly ngZone: NgZone) {}

  connect(): void {
    if (this.connected || this.client?.active) {
      return;
    }

    const token = this.getTokenFromStorage();

    if (!token) {
      return;
    }

    if (this.isTokenExpired(token)) {
      console.warn('[WS] Auth token expired. Please login again.');
      this.disconnect();
      return;
    }

    this.client = new Client({
      brokerURL: this.wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,
      debug: () => {
        /*
         * Keep empty to avoid console flooding.
         * Use console.log(message) here only while debugging websocket frames.
         */
      },
      onConnect: () => {
        this.connected = true;
        console.log('[WS] Connected successfully');

        this.client?.subscribe('/user/queue/access-notifications', (message: IMessage) => {
          this.ngZone.run(() => {
            this.accessNotificationSubject.next(this.parseBody(message.body));
          });
        });

        this.client?.subscribe('/user/queue/medical-profile-updates', (message: IMessage) => {
          this.ngZone.run(() => {
            this.medicalProfileUpdateSubject.next(this.parseBody(message.body));
          });
        });
      },
      onStompError: frame => {
        console.error('[WS] STOMP error:', frame.headers['message'], frame.body);
        this.connected = false;
      },
      onWebSocketClose: event => {
        console.warn('[WS] Closed:', event);
        this.connected = false;
      },
      onWebSocketError: event => {
        console.error('[WS] WebSocket error:', event);
        this.connected = false;
      }
    });

    this.client.activate();
  }

  disconnect(): void {
    this.client?.deactivate();
    this.client = null;
    this.connected = false;
  }

  private getTokenFromStorage(): string | null {
    const directToken =
      localStorage.getItem('accessToken') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('accessToken') ||
      sessionStorage.getItem('authToken') ||
      sessionStorage.getItem('token') ||
      '';

    if (directToken) {
      return this.cleanToken(directToken);
    }

    const rawUser =
      localStorage.getItem('medverseCurrentUser') ||
      localStorage.getItem('currentUser') ||
      sessionStorage.getItem('medverseCurrentUser') ||
      sessionStorage.getItem('currentUser') ||
      '';

    if (!rawUser) {
      return null;
    }

    try {
      const user = JSON.parse(rawUser);

      const token =
        user?.authToken ||
        user?.accessToken ||
        user?.token ||
        user?.data?.authToken ||
        user?.data?.accessToken ||
        user?.data?.token ||
        '';

      return token ? this.cleanToken(token) : null;
    } catch {
      return null;
    }
  }

  private cleanToken(token: string): string {
    return String(token || '').replace(/^Bearer\s+/i, '').trim();
  }

  private decodeTokenPayload(token: string): any | null {
    try {
      const payload = token.split('.')[1];

      if (!payload) {
        return null;
      }

      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeTokenPayload(token);

    if (!payload?.exp) {
      return false;
    }

    return Date.now() >= payload.exp * 1000;
  }

  private parseBody(body: string): any {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
}