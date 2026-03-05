import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';

import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification.model';
import { ApiResponse } from '../models/api-response.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private readonly API_URL = `${environment.apiUrl}/notifications`;
  private readonly WS_URL = environment.wsUrl;
  private readonly WS_CONNECT_TIMEOUT_MS = 7000;

  private stompClient: any = null;
  private connectTimeoutHandle: ReturnType<typeof setTimeout> | null = null;
  private connectionStatus = new BehaviorSubject<'connected' | 'disconnected' | 'connecting'>('disconnected');
  public connectionStatus$ = this.connectionStatus.asObservable();

  private notifications = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notifications.asObservable();

  private unreadCount = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCount.asObservable();

  private newNotification = new Subject<Notification>();
  public newNotification$ = this.newNotification.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        try {
          this.connectWebSocket();
        } catch (error) {
          console.error('WebSocket init failed, continuing without realtime connection', error);
          this.connectionStatus.next('disconnected');
        }
        this.loadNotifications();
      } else {
        this.disconnectWebSocket();
      }
    });
  }

  ngOnDestroy(): void {
    this.disconnectWebSocket();
  }

  private connectWebSocket(): void {
    if (this.stompClient?.active) return;

    const token = this.authService.getToken();
    if (!token || !this.WS_URL) {
      this.connectionStatus.next('disconnected');
      return;
    }

    this.connectionStatus.next('connecting');
    this.startConnectTimeout();

    const SockJsCtor = ((SockJS as unknown as { default?: unknown }).default ?? SockJS) as new (url: string) => unknown;

    this.stompClient = new Client({
      webSocketFactory: () => new SockJsCtor(this.WS_URL),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str: string) => {
        if (!environment.production) {
          console.log('STOMP: ' + str);
        }
      },
      connectionTimeout: this.WS_CONNECT_TIMEOUT_MS,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = () => {
      console.log('WebSocket Connected');
      this.clearConnectTimeout();
      this.connectionStatus.next('connected');
      this.subscribeToNotifications();
    };

    this.stompClient.onStompError = (frame: any) => {
      console.error('STOMP Error:', frame);
      this.clearConnectTimeout();
      this.connectionStatus.next('disconnected');
    };

    this.stompClient.onDisconnect = () => {
      console.log('WebSocket Disconnected');
      this.clearConnectTimeout();
      this.connectionStatus.next('disconnected');
    };

    this.stompClient.onWebSocketError = (error: Event) => {
      console.error('WebSocket Error:', error);
      this.clearConnectTimeout();
      this.connectionStatus.next('disconnected');
    };

    this.stompClient.onWebSocketClose = () => {
      this.clearConnectTimeout();
      this.connectionStatus.next('disconnected');
    };

    this.stompClient.activate();
  }

  private disconnectWebSocket(): void {
    this.clearConnectTimeout();
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
    this.connectionStatus.next('disconnected');
  }

  private startConnectTimeout(): void {
    this.clearConnectTimeout();
    this.connectTimeoutHandle = setTimeout(() => {
      if (this.connectionStatus.value === 'connecting') {
        this.connectionStatus.next('disconnected');
      }
    }, this.WS_CONNECT_TIMEOUT_MS);
  }

  private clearConnectTimeout(): void {
    if (this.connectTimeoutHandle) {
      clearTimeout(this.connectTimeoutHandle);
      this.connectTimeoutHandle = null;
    }
  }

  private subscribeToNotifications(): void {
    const userId = this.authService.currentUser?.id;
    if (!userId || !this.stompClient) return;

    this.stompClient.subscribe(
      `/topic/notifications/${userId}`,
      (message: any) => {
        const notification: Notification = JSON.parse(message.body);
        this.handleNewNotification(notification);
      }
    );

    this.stompClient.subscribe(
      `/topic/notifications/broadcast`,
      (message: any) => {
        const notification: Notification = JSON.parse(message.body);
        this.handleNewNotification(notification);
      }
    );
  }

  private handleNewNotification(notification: Notification): void {
    const current = this.notifications.value;
    this.notifications.next([notification, ...current]);
    
    if (!notification.isRead) {
      this.unreadCount.next(this.unreadCount.value + 1);
    }
    
    this.newNotification.next(notification);
  }

  loadNotifications(): void {
    this.http.get<ApiResponse<Notification[]>>(this.API_URL)
      .pipe(map(response => response.data))
      .subscribe({
        next: (notifications) => {
          this.notifications.next(notifications);
          const unread = notifications.filter(n => !n.isRead).length;
          this.unreadCount.next(unread);
          this.getUnreadCount().subscribe({
            next: count => this.unreadCount.next(count),
            error: () => {
              // Keep locally calculated fallback if unread-count endpoint is unavailable.
            }
          });
        },
        error: (err) => console.error('Failed to load notifications', err)
      });
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<ApiResponse<{ unreadCount: number }>>(`${this.API_URL}/unread/count`)
      .pipe(map(response => response.data.unreadCount));
  }

  markAsRead(notificationId: number): Observable<void> {
    return this.http.put<ApiResponse<void>>(`${this.API_URL}/${notificationId}/read`, {})
      .pipe(
        map(response => response.data),
        tap(() => {
          const notifications = this.notifications.value.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          );
          this.notifications.next(notifications);
          this.unreadCount.next(Math.max(0, this.unreadCount.value - 1));
        })
      );
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<ApiResponse<void>>(`${this.API_URL}/read-all`, {})
      .pipe(
        map(response => response.data),
        tap(() => {
          const notifications = this.notifications.value.map(n => ({ ...n, isRead: true }));
          this.notifications.next(notifications);
          this.unreadCount.next(0);
        })
      );
  }

  deleteNotification(notificationId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${notificationId}`)
      .pipe(
        map(response => response.data),
        tap(() => {
          const notifications = this.notifications.value.filter(n => n.id !== notificationId);
          this.notifications.next(notifications);
        })
      );
  }

  sendTestNotification(): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.API_URL}/test`, {})
      .pipe(map(response => response.data));
  }
}
