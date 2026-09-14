import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  // Indique si le menu mobile est ouvert.
  isMenuOpen = false;

  // Ouvre ou ferme le menu mobile.
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  // Ferme le menu après la navigation.
  closeMenu(): void {
    this.isMenuOpen = false;
  }
}