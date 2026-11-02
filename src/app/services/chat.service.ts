
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

import {
  ChatRequest,
  ChatResponse,
} from '../models/chat.model';

@Injectable({
  providedIn: 'root',
})
export class ChatService {

  // Service HTTP pour communiquer avec Django.
  private readonly http = inject(HttpClient);

  /**
   * Envoie une question au chatbot contextuel
   * pour une situation administrative existante.
   */
  sendMessage(
    publicId: string,
    data: ChatRequest,
  ): Observable<ChatResponse> {

    return this.http.post<ChatResponse>(
      `${environment.apiUrl}/orientations/situations/${publicId}/chat/`,
      data,
    );
  }
}
