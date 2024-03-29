import {Component, EventEmitter, Output} from '@angular/core';
import {KeyValuePipe, NgForOf} from "@angular/common";
import {MatCardModule} from "@angular/material/card";
import {MatIcon} from "@angular/material/icon";
import {FormsModule} from "@angular/forms";
import {MatCheckboxModule} from "@angular/material/checkbox";


@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    NgForOf,
    MatCardModule,
    MatIcon,
    FormsModule,
    KeyValuePipe,
    MatCheckboxModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  private static readonly DEFAULT_IGNORED_SECTIONS: { [_: string]: boolean } = {
    'Etymology': false,
    'Usage_notes': false,
    'Trivia': false,

    'Declension': true,
    'Conjugation': true,
    'Inflection': true,
    'Mutation': true,

    'Anagrams': true,
    'Synonyms': true,
    'Antonyms': true,
    'Hypernyms': true,
    'Hyponyms': true,
    'Translations': true,

    'Alternative_forms': true,
    'Related_terms': true,
    'Descendants': true,
    'Derived_terms': true,
    'See_also': true,

    'Pronunciation': true,
    'Gallery': true,
    'Quotations': true,

    'References': true,
    'Further_reading': true,
  };
  private static readonly DEFAULT_LANGUAGES = ['English'];

  ignoredSections:  { [_: string]: boolean } = {};
  languages: string[] = [];
  newLanguage = '';

  @Output() languagesUpdate = new EventEmitter<string[]>();
  @Output() ignoredSectionsUpdate = new EventEmitter<string[]>();

  constructor() {
    this.load();
  }

  removeLanguage(language: string) {
    const index = this.languages.indexOf(language);

    if (index < 0) {
      return;
    }

    this.languages.splice(index, 1);
  }

  addLanguage() {
    if (this.newLanguage == '') {
      return;
    }

    if (this.languages.includes(this.newLanguage)) {
      this.newLanguage = '';
      return;
    }

    this.languages.push(this.newLanguage);
    this.newLanguage = '';
  }

  toggleIgnored(section: string) {
    this.ignoredSections[section] = !this.ignoredSections[section];
  }

  save() {
    this.languagesUpdate.emit(this.languages);
    this.emitIgnoredSectionsUpdate();

    browser.runtime.sendMessage({
      request: 'set',
      key: 'languages',
      value: this.languages
    });

    browser.runtime.sendMessage({
      request: 'set',
      key: 'ignoredSections',
      value: this.ignoredSections
    });
  }

  load() {
    this.newLanguage = '';

    browser.runtime.sendMessage({request: 'get', key: 'languages'})
      .then(
        response => {
          this.languages = response?.languages ?? structuredClone(SettingsComponent.DEFAULT_LANGUAGES);
          this.languagesUpdate.emit(this.languages);
        },
        reason => {
          this.languages = structuredClone(SettingsComponent.DEFAULT_LANGUAGES);
          this.languagesUpdate.emit(this.languages);
        }
      );

    browser.runtime.sendMessage({request: 'get', key: 'ignoredSections'})
      .then(
        response => {
          this.ignoredSections = response?.ignoredSections ?? structuredClone(SettingsComponent.DEFAULT_IGNORED_SECTIONS);
          this.emitIgnoredSectionsUpdate();
        },
        reason => {
          this.ignoredSections = structuredClone(SettingsComponent.DEFAULT_IGNORED_SECTIONS);
          this.emitIgnoredSectionsUpdate();
        }
      );
  }

  private emitIgnoredSectionsUpdate() {
    this.ignoredSectionsUpdate.emit(
      Object.keys(this.ignoredSections)
        .filter(section => this.ignoredSections[section])
    )
  }
}
