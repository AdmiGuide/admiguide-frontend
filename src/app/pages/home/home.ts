import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowRight,
  LucideBriefcase,
  LucideFileText,
  LucideHeart,
  LucideShieldCheck,
} from '@lucide/angular';

@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    LucideArrowRight,
    LucideBriefcase,
    LucideFileText,
    LucideHeart,
    LucideShieldCheck,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}