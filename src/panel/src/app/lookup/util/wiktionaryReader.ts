import {splitArray} from './split';

export default class WiktionaryReader {
  private static readonly wiktionaryNormalUrl = 'https://en.wiktionary.org/wiki/';
  private static readonly wiktionaryApiUrl = 'https://en.wiktionary.org/w/api.php?origin=*&action=parse&format=json&formatversion=2&page=';
  private static readonly PARSER = new DOMParser();

  private pageName: string;
  private language: string | undefined = undefined;
  private ignoredSections: string[] = [];
  private shouldFormat = false;

  public static findUniqueFormOfDefinition(element: HTMLElement) {
    const orderedListItems = element.querySelectorAll('ol li:not(ol ol li)');
    if (orderedListItems.length > 1) {
      return null;
    }

    const parses: NodeListOf<HTMLElement> = element.querySelectorAll('.form-of-definition:not(ol ol li span)');
    if (parses.length != 1) {
      return null;
    }
    const parse = parses[0];

    const lemmaAnchor: HTMLAnchorElement | null = parse.querySelector('.form-of-definition-link a');
    if (lemmaAnchor == null) {
      return null;
    }

    const lemma = lemmaAnchor.title;
    if (lemma == '') {
      return null;
    }

    return {
      parse: parse,
      lemma: lemma
    }
  }

  private onLinkClickCallback = (_: string | null) => {
  };

  public formatting(shouldFormat: boolean) {
    this.shouldFormat = shouldFormat;
    return this;
  }

  public selectingLanguage(language: string | undefined) {
    this.language = language;
    this.shouldFormat = true;
    return this;
  }

  public ignoringSections(ignoredSections: string[]) {
    this.ignoredSections = ignoredSections;
    this.shouldFormat = true;
    return this;
  }

  public withLinkClickCallback(callback: (href: string | null) => void) {
    this.onLinkClickCallback = callback;
    return this;
  }

  public get(pageName: string): Promise<HTMLElement> {
    this.pageName = pageName;
    return new Promise<HTMLElement>((resolve, reject) => {
      browser.runtime.sendMessage({
        request: 'fetch',
        url: WiktionaryReader.wiktionaryApiUrl + pageName
      }).then(
        value => {
          if (value == null || value.error) {
            reject();
          } else {
            resolve(
              this.formatPage(WiktionaryReader.PARSER.parseFromString(value.parse.text, 'text/html'))
            );
          }
        },
        reason => reject()
      );
    });
  }

  private formatPage(page: Document): HTMLElement {
    this.stripEditLinks(page.body);
    this.stripFloatRightElements(page.body);
    this.stripFigures(page.body);
    this.replaceLinksWithCallback(page.body);

    if (!this.shouldFormat) {
      return page.body;
    }

    let languageDivs = this.restructureElements(page)

    const pageDiv = document.createElement('div');
    const titleHeading = this.generateTitle(this.pageName);
    pageDiv.replaceChildren(...[titleHeading].concat(languageDivs));
    return pageDiv;
  }

  private restructureElements(page: Document) {
    const contentElements = page.querySelector('.mw-content-ltr')!.children;
    const languageDivs: HTMLDivElement[] = [];

    const elementListsPerLanguage = splitArray<Element>(Array.from(contentElements),
      (element: Element) => element.tagName === 'H2');

    for (const languageElements of elementListsPerLanguage) {
      const language = languageElements[0].firstElementChild!.id;

      if (this.language != undefined) {
        if (language != this.language) {
          continue;
        }
      }

      const languageDiv = document.createElement('div');
      languageDivs.push(languageDiv);
      languageDiv.appendChild(languageElements[0]);

      const elementListsPerSection = splitArray(languageElements.slice(1),
        (element: Element) => /H\d/.test(element.tagName));

      for (const sectionElements of elementListsPerSection) {
        const section = sectionElements[0].firstElementChild!.id;

        if (this.ignoredSections.some(ignoredSection => section.startsWith(ignoredSection))) {
          continue;
        }

        const sectionDiv = document.createElement('div');
        languageDiv.appendChild(sectionDiv);
        for (const element of sectionElements) {
          sectionDiv.appendChild(element);
        }
      }
    }

    return languageDivs;
  }

  private stripEditLinks(element: Element) {
    this.removeBySelector(element, '.mw-editsection');
  }

  private stripFloatRightElements(element: Element) {
    this.removeBySelector(element, '.floatright');
  }

  private stripFigures(element: Element) {
    this.removeBySelector(element, 'figure');
  }

  private removeBySelector(rootElement: Element, selector: string) {
    const elements = rootElement.querySelectorAll(selector);

    for (let element of Array.from(elements)) {
      element.parentNode?.removeChild(element);
    }
  }

  private replaceLinksWithCallback(element: HTMLElement) {
    const anchors = Array.from(element.querySelectorAll('a'));
    for (const anchor of anchors) {
      if (anchor.className === 'extiw' || anchor.classList.contains('external')) {
        // External link, open in new tab
        anchor.target = '_blank';
        continue;
      }

      if (anchor.href.startsWith('#')) {
        continue;
      }

      if (anchor.classList.contains('new')) {
        anchor.removeAttribute('href');
        continue;
      }

      anchor.onclick
        = (href => () => this.onLinkClickCallback(href))(anchor.getAttribute('href'));
      anchor.removeAttribute('href');
    }
  }

  private generateTitle(pageName: string): HTMLElement {
    const headingWrapper = document.createElement('a');
    headingWrapper.href = WiktionaryReader.wiktionaryNormalUrl + pageName;
    headingWrapper.target = '_blank';
    headingWrapper.className = 'external';

    const heading = document.createElement('h1');
    heading.innerText = decodeURI(pageName);

    const superscript = document.createElement('sup');
    superscript.innerText = '↗';
    heading.appendChild(superscript);

    headingWrapper.appendChild(heading);
    return headingWrapper;
  }
}
