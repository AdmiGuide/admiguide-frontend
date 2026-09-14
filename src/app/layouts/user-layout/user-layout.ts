import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../../components/header/header';
import { Footer } from '../../components/footer/footer';

@Component({
  imports: [RouterOutlet, Header, Footer],
  selector: 'app-user-layout',
  styleUrl: './user-layout.css',
  templateUrl: './user-layout.html',
})
export class UserLayout {}
