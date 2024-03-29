import {Component, ElementRef, Input, ViewChild} from "@angular/core";
import {NgForOf, NgIf} from "@angular/common";
import {Subject} from "rxjs";
import WiktionaryReader from "./util/wiktionaryReader";
import {FormsModule} from "@angular/forms";
import {MatIcon} from "@angular/material/icon";
import {MatSidenavModule} from "@angular/material/sidenav";
import {DragDropModule} from "@angular/cdk/drag-drop";
import {SettingsComponent} from "./settings/settings.component";
import {MatProgressSpinner} from "@angular/material/progress-spinner";

@Component({
  selector: 'app-lookup',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    FormsModule,
    MatIcon,
    MatSidenavModule,
    DragDropModule,
    SettingsComponent,
    MatProgressSpinner
  ],
  templateUrl: './lookup.component.html',
  styleUrl: './lookup.component.scss'
})
export class LookupComponent {
  private static readonly HISTORY_MAX_SIZE = 30;

  @Input() querySubject: Subject<string>;
  query = '';
  loading = false;

  @ViewChild('results') private results: ElementRef<HTMLDivElement>;

  private readonly lookupReader: WiktionaryReader;
  languages: string[] = [];
  selectedLanguage: string | undefined;
  private ignoredSections: string[] = [];

  readonly history: HTMLDivElement[] = [];

  constructor() {
    this.lookupReader = new WiktionaryReader()
      .withLinkClickCallback((href) => this.onLinkClicked(href));
  }

  ngOnInit() {
    this.querySubject.subscribe((value) => this.lookUpWord(value));
  }

  public lookUpWord(word: string) {
    this.query = word;
    this.lookUpPage(word);
  }

  updateLanguage() {
    this.lookupReader.selectingLanguage(this.selectedLanguage);
  }

  updateLanguages(languages: string[]) {
    this.languages = languages;
    this.selectedLanguage = languages[0];
    this.updateLanguage();

  }

  updateIgnoredSections(ignoredSections: string[]) {
    this.ignoredSections = ignoredSections;
    this.lookupReader.ignoringSections(ignoredSections);
  }

  private lookUpPage(pageName: string) {
    this.loading = true;
    this.lookupReader.get(pageName)
      .then(
        (element) => {
          const formOfDefinition = WiktionaryReader.findUniqueFormOfDefinition(element);
          if (formOfDefinition == null) {
            this.setContent(element);
            this.loading = false;
          } else {
            this.setContent(formOfDefinition.parse);
            this.lookUpPage(formOfDefinition.lemma);
          }
        },
        () => {
          if (pageName.toLowerCase() != pageName) {
            this.lookUpPage(pageName.toLowerCase());
          } else {
            this.loading = false;
          }
        }
      );
  }

  back() {
    if (this.history.length == 0) {
      return;
    }

    this.results.nativeElement.replaceChildren(...Array.from(this.history.pop()!.childNodes));
  }

  private setContent(element: HTMLElement) {
    const previousDiv = document.createElement('div');
    previousDiv.replaceChildren(...Array.from(this.results.nativeElement.childNodes));
    this.history.push(previousDiv);

    if (this.history.length > LookupComponent.HISTORY_MAX_SIZE) {
      this.history.shift();
    }

    this.results.nativeElement.replaceChildren(...Array.from(element.childNodes));
  }

  private onLinkClicked(href: string | null) {
    if (href == null) {
      return;
    }

    let match, pageName;
    const reader = new WiktionaryReader()
      .withLinkClickCallback((href) => this.onLinkClicked(href));

    if (match = href.match(/^\/wiki\/(Reconstruction:([^\/]+)\/.*)$/)) { // "/wiki/Reconstruction:LANGUAGE/WORD"
      pageName = match[1];
      reader.selectingLanguage(match[2]);
      reader.ignoringSections(this.ignoredSections);
    } else if (match = href.match(/^\/wiki\/([^\/:]+)#(.*)$/)) { // "/wiki/WORD#LANGUAGE"
      pageName = match[1];
      reader.selectingLanguage(match[2]);
      reader.ignoringSections(this.ignoredSections);
    } else if (match = href.match(/^\/wiki\/([^\/:]+)$/)) { // "/wiki/WORD"
      pageName = match[1];
      reader.formatting(true);
      reader.ignoringSections(this.ignoredSections);
    } else if (match = href.match(/^\/wiki\/([^\/]+)$/)) { // "/wiki/CATEGORY:PAGE"
      pageName = match[1];
    } else {
      console.log('Unknown link found: ' + href);
      return;
    }

    this.loading = true;
    reader.get(pageName)
      .then(
        element => {
          this.setContent(element);
          this.loading = false;
        },
        reason => this.loading = false
      )
  }
}
