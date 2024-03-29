import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {LookupComponent} from "./lookup/lookup.component";
import {Subject} from "rxjs";
import {NgIf} from "@angular/common";

@Component({
  selector: 'fwl-panel',
  standalone: true,
  imports: [RouterOutlet, LookupComponent, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',

})
export class AppComponent {
  opened = false;
  querySubject = new Subject<string>();


  constructor() {
    document.body.style.setProperty('touch-action', 'manipulation');
    document.addEventListener('dblclick', (ev) => {
      ev.preventDefault();
      this.opened = true;
      this.lookUpSelection(ev);
    });
  }

  private lookUpSelection(ev: MouseEvent) {
    const selection = document?.getSelection()?.toString().trim();
    if (selection) {
      this.querySubject.next(selection);
    }
  }

  close() {
    this.opened = false;
  }

  open() {
    this.opened = true;
  }
}
