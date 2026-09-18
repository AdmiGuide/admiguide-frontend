import {
  computed,
  inject,
  Service,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  catchError,
  finalize,
  map,
  Observable,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

// Identifiants envoyés lors de la connexion.
interface LoginCredentials {
  email: string;
  password: string;
}

// Données envoyées lors de la création du compte.
interface RegisterCredentials {
  nom_complet: string;
  email: string;
  pays_residence: string;
  password: string;
}

// Tokens retournés après connexion.
interface LoginResponse {
  access: string;
  refresh: string;
}

// Tokens retournés après rafraîchissement.
interface RefreshResponse {
  access: string;
  refresh?: string;
}

// Champs que l'utilisateur peut modifier depuis son profil.
interface UpdateProfileData {
  nom_complet: string;
  pays_residence: string;
}

@Service()
export class AuthService {
  // Permet d'effectuer les appels HTTP vers Django.
  private readonly http = inject(HttpClient);

  // Clés utilisées dans le localStorage.
  private readonly accessTokenKey = 'admiguide_access_token';
  private readonly refreshTokenKey = 'admiguide_refresh_token';

  // Utilisateur actuellement connecté.
  readonly currentUser = signal<User | null>(null);

  // État réactif de la connexion.
  readonly isAuthenticated = computed(
    () => this.currentUser() !== null,
  );

  // Indique si l'utilisateur connecté est administrateur.
  readonly isAdmin = computed(
    () => this.currentUser()?.role === 'admin',
  );

  // Crée un nouveau compte utilisateur.
  register(credentials: RegisterCredentials): Observable<User> {
    return this.http.post<User>(
      `${environment.apiUrl}/auth/register/`,
      credentials,
    );
  }


  // Connecte l'utilisateur puis récupère son profil.
  login(credentials: LoginCredentials): Observable<User> {
    return this.http
      .post<LoginResponse>(
        `${environment.apiUrl}/auth/login/`,
        credentials,
      )
      .pipe(
        // Enregistre les tokens retournés par Django.
        tap((tokens) => {
          this.saveTokens(tokens);
        }),

        // Récupère ensuite le profil de l'utilisateur.
        switchMap(() => this.getProfile()),
      );
  }

  // Récupère le profil de l'utilisateur connecté.
  getProfile(): Observable<User> {
    return this.http
      .get<User>(
        `${environment.apiUrl}/auth/profile/`,
      )
      .pipe(
        // Met à jour l'état utilisateur dans Angular.
        tap((user) => {
          this.currentUser.set(user);
        }),
      );
  }

  // Génère un nouvel access token avec le refresh token.
  refreshToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(
        () => new Error('Aucun refresh token disponible.'),
      );
    }

    return this.http
      .post<RefreshResponse>(
        `${environment.apiUrl}/auth/refresh/`,
        {
          refresh: refreshToken,
        },
      )
      .pipe(
        tap((tokens) => {
          // Remplace l'ancien access token.
          localStorage.setItem(
            this.accessTokenKey,
            tokens.access,
          );

          // SimpleJWT peut retourner un nouveau refresh token.
          if (tokens.refresh) {
            localStorage.setItem(
              this.refreshTokenKey,
              tokens.refresh,
            );
          }
        }),

        // Retourne uniquement le nouvel access token.
        map((tokens) => tokens.access),
      );
  }

  // Restaure l'utilisateur après actualisation de la page.
  restoreSession(): Observable<User | null> {
    const hasToken =
      this.getAccessToken() || this.getRefreshToken();

    if (!hasToken) {
      return of(null);
    }

    return this.getProfile().pipe(
      catchError(() => {
        // Supprime la session si les tokens ne sont plus valides.
        this.clearSession();

        return of(null);
      }),
    );
  }

  // Retourne l'access token courant.
  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  // Retourne le refresh token courant.
  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  // Supprime les tokens et l'utilisateur connecté.
  clearSession(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);

    this.currentUser.set(null);
  }

  // Enregistre les tokens après connexion.
  private saveTokens(tokens: LoginResponse): void {
    localStorage.setItem(
      this.accessTokenKey,
      tokens.access,
    );

    localStorage.setItem(
      this.refreshTokenKey,
      tokens.refresh,
    );
  }

  // Met à jour les informations modifiables du profil.
  updateProfile(data: UpdateProfileData): Observable<User> {
    return this.http
      .patch<User>(
        `${environment.apiUrl}/auth/profile/`,
        data,
      )
      .pipe(
        // Met également à jour l'utilisateur actuellement stocké dans Angular.
        tap((user) => {
          this.currentUser.set(user);
        }),
      );
  }

  // Déconnecte l'utilisateur et invalide son refresh token.
  logout(): Observable<void> {
    const refreshToken = this.getRefreshToken();

    // Nettoie directement la session si aucun refresh token n'existe.
    if (!refreshToken) {
      this.clearSession();
      return of(void 0);
    }

    return this.http
      .post<void>(
        `${environment.apiUrl}/auth/logout/`,
        {
          refresh: refreshToken,
        },
      )
      .pipe(
        // Nettoie toujours la session locale à la fin.
        finalize(() => {
          this.clearSession();
        }),
      );
  }
}