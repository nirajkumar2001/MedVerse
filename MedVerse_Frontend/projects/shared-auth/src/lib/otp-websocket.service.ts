import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { API_ORIGIN } from '../../../shared-services/src/lib/api-config';

export interface OtpWebSocketMessage {
  sessionId: string;
  otpRefId: string;
  otp: string;
  expiresInSeconds: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class OtpWebSocketService {
  private readonly socketUrl = API_ORIGIN.replace(/^http/, 'ws') + '/ws';
  private readonly otpMessagesSubject = new Subject<OtpWebSocketMessage>();
  readonly otpMessages$ = this.otpMessagesSubject.asObservable();

  watchOtp(sessionId: string): Observable<OtpWebSocketMessage> {
    return new Observable<OtpWebSocketMessage>(observer => {
      if (!sessionId) {
        observer.error(new Error('OTP sessionId is required.'));
        return;
      }

      const socket = new WebSocket(this.socketUrl);
      const subscriptionId = `otp-${Date.now()}`;
      let connected = false;

      socket.onopen = (): void => {
        // STOMP CONNECT frame: opens the broker session before subscribing.
        socket.send('CONNECT\naccept-version:1.2\nheart-beat:10000,10000\n\n\0');
      };

      socket.onmessage = (event: MessageEvent<string>): void => {
        const frames = String(event.data || '').split('\0').filter(Boolean);

        frames.forEach(frame => {
          if (frame.startsWith('CONNECTED')) {
            connected = true;
            // Subscribe to the unique OTP topic for this browser/session.
            socket.send(`SUBSCRIBE\nid:${subscriptionId}\ndestination:/topic/otp/${sessionId}\n\n\0`);
            return;
          }

          if (frame.startsWith('MESSAGE')) {
            const body = frame.substring(frame.indexOf('\n\n') + 2).trim();
            const payload = JSON.parse(body) as OtpWebSocketMessage;
            console.log('[WEBSOCKET_OTP_RECEIVED]', payload);
            sessionStorage.setItem(`medverse-otp:${payload.otpRefId}`, payload.otp);
            this.otpMessagesSubject.next(payload);
            observer.next(payload);
          }
        });
      };

      socket.onerror = (): void => {
        if (!connected) {
          observer.error(new Error('Unable to connect to OTP WebSocket.'));
        }
      };

      socket.onclose = (): void => {
        observer.complete();
      };

      return () => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(`UNSUBSCRIBE\nid:${subscriptionId}\n\n\0`);
          socket.send('DISCONNECT\n\n\0');
        }
        socket.close();
      };
    });
  }
}
