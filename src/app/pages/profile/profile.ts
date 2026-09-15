import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { UserSidebar } from '../../components/user-sidebar/user-sidebar';
import { COUNTRIES } from '../../data/countries';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    UserSidebar,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  // Construit et gère le formulaire réactif.
  private readonly formBuilder = inject(FormBuilder);

  // Donne accès au profil et aux actions d'authentification.
  readonly authService = inject(AuthService);

  // Permet la redirection après une déconnexion.
  private readonly router = inject(Router);

  // États utilisés par l'interface.
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  // Liste utilisée dans le select du pays.
  readonly countries = COUNTRIES;

  // Autorise les lettres, espaces, apostrophes et tirets.
  private readonly namePattern =
    /^[\p{L}]+(?:[ '\u2019-][\p{L}]+)*$/u;

  // Initiales affichées dans l'avatar.
  readonly userInitials = computed(() => {
    const user = this.authService.currentUser();

    if (!user?.nom_complet) {
      return '';
    }

    const names = user.nom_complet.trim().split(/\s+/);

    const firstInitial = names[0]?.[0] ?? '';
    const lastInitial =
      names.length > 1
        ? names[names.length - 1]?.[0] ?? ''
        : '';

    return `${firstInitial}${lastInitial}`.toUpperCase();
  });

  // Formulaire de modification du profil.
  readonly profileForm = this.formBuilder.nonNullable.group({
    nom_complet: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(200),
        Validators.pattern(this.namePattern),
      ],
    ],

    email: [''],

    pays_residence: [
      '',
      [
        Validators.required,
        Validators.maxLength(100),
      ],
    ],
  });

  ngOnInit(): void {
    // Utilise immédiatement l'utilisateur déjà chargé
    // pendant l'authentification.
    const currentUser = this.authService.currentUser();

    if (currentUser) {
      this.fillForm(currentUser);
      return;
    }

    // Sécurité supplémentaire si le profil
    // n'est pas encore présent en mémoire.
    this.authService.getProfile().subscribe({
      next: (user) => {
        this.fillForm(user);
      },

      error: () => {
        this.errorMessage.set(
          'Impossible de charger votre profil.',
        );
      },
    });
  }

  // Enregistre les modifications du profil.
  saveProfile(): void {
    if (this.profileForm.invalid || this.isSaving()) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const {
      nom_complet,
      pays_residence,
    } = this.profileForm.getRawValue();

    this.authService
      .updateProfile({
        nom_complet: nom_complet.trim(),
        pays_residence,
      })
      .subscribe({
        next: (user) => {
          this.fillForm(user);

          this.successMessage.set(
            'Vos informations ont été mises à jour.',
          );

          this.isSaving.set(false);
        },

        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur modification profil :',
            error,
          );

          this.errorMessage.set(
            this.getBackendError(error),
          );

          this.isSaving.set(false);
        },
      });
  }

  // Déconnecte l'utilisateur depuis la carte mobile.
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },

      error: () => {
        this.router.navigate(['/']);
      },
    });
  }

  // Injecte les données utilisateur dans le formulaire.
  private fillForm(user: User): void {
    this.profileForm.patchValue({
      nom_complet: user.nom_complet,
      email: user.email,
      pays_residence: user.pays_residence,
    });
  }

  // Transforme les erreurs Django en message lisible.
  private getBackendError(
    error: HttpErrorResponse,
  ): string {
    const errors = error.error;

    if (errors?.nom_complet) {
      return Array.isArray(errors.nom_complet)
        ? errors.nom_complet[0]
        : errors.nom_complet;
    }

    if (errors?.pays_residence) {
      return Array.isArray(errors.pays_residence)
        ? errors.pays_residence[0]
        : errors.pays_residence;
    }

    return 'Impossible d’enregistrer les modifications.';
  }
}