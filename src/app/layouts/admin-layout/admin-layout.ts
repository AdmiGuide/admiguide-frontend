import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AdminSidebar } from '../../components/admin-sidebar/admin-sidebar';
import { Footer } from '../../components/footer/footer';
import { Header } from '../../components/header/header';

@Component({
  selector: 'app-admin-layout',
  imports: [
    RouterOutlet,
    Header,
    Footer,
    AdminSidebar,
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout {}