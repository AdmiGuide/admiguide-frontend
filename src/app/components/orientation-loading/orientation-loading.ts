import {
  Component,
  output,
} from '@angular/core';


@Component({
  selector: 'app-orientation-loading',

  imports: [],

  templateUrl: './orientation-loading.html',
  styleUrl: './orientation-loading.css',
})
export class OrientationLoading {

  // Informe le composant parent
  // lorsque l'utilisateur annule l'analyse.
  readonly cancel =
    output<void>();


  cancelAnalysis(): void {
    this.cancel.emit();
  }
}