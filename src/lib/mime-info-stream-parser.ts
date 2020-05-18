import { SAXOptions, SAXStream, Tag } from 'sax';
import { Transform } from 'stream';

export interface MimeInfoItem {
  comment: string;
  acronym?: string;
  acronymExpanded?: string;
}

interface MimeInfoTrackedAlias {
  aliases: string[];
  item: MimeInfoItem | null;
}

export class MimeInfoStreamParser extends Transform {
  private _sax: SAXStream;

  private _openMimeInfo = false;
  private _openMimeType: string | null = null;
  private _openComment = false;
  private _openAlias = '';
  private _aliases: string[] = [];
  private _openAcronym = false;
  private _openAcronymExpanded = false;

  private _item: MimeInfoItem | null = null;
  private _mimeTypes: string[] = [];
  private _trackedAliases: MimeInfoTrackedAlias[] = [];

  constructor() {
    super();
    const saxOptions: SAXOptions = {};
    this._sax = new SAXStream(true, saxOptions);
    this._init();
  }

  public _transform(
    chunk: Buffer | string,
    encoding: string,
    callback: () => void
  ): void {
    this._sax.write(chunk, encoding);
    callback();
  }

  private _error(error: Error): void {
    this.emit('error', error);
  }

  private _init(): void {
    this._sax.on('error', (error: Error) => this._error(error));
    this._sax.on('opentag', (tag: Tag) => this._openTags(tag));
    this._sax.on('closetag', (name: string) => this._closeTags(name));
    this._sax.on('text', (text: string) => this._tagText(text));
  }

  private _openTags(tag: Tag): void {
    switch (tag.name) {
      case 'mime-info':
        this._onOpenMimeInfo();
        break;
      case 'mime-type':
        this._openMimeInfo && this._onOpenMimeType(tag);
        break;
      case 'comment':
        this._openMimeType && this._onOpenMimeTypeComment();
        break;
      case 'alias':
        this._openMimeType && this._onOpenMimeTypeAlias(tag);
        break;
      case 'acronym':
        this._openMimeType && this._onOpenAcronym();
        break;
      case 'expanded-acronym':
        this._openMimeType && this._onOpenExpandedAcronym();
        break;
      default:
        break;
    }
  }

  private _closeTags(name: string): void {
    switch (name) {
      case 'mime-info':
        this._onCloseMimeInfo();
        break;
      case 'mime-type':
        this._openMimeType && this._onCloseMimeType();
        break;
      case 'comment':
        this._openComment && this._onCloseMimeTypeComment();
        break;
      case 'alias':
        this._openAlias && this._onCloseMimeTypeAlias();
        break;
      case 'acronym':
        this._openAcronym && this._onCloseAcronym();
        break;
      case 'expanded-acronym':
        this._openAcronymExpanded && this._onCloseExpandedAcronym();
        break;
      default:
        break;
    }
  }

  private _tagText(text: string): void {
    if (this._openComment) {
      this._onCommentText(text);
    } else if (this._openAcronym) {
      this._onAcronymText(text);
    } else if (this._openAcronymExpanded) {
      this._onAcronymExpandedText(text);
    }
  }

  private _onOpenMimeInfo(): void {
    this._openMimeInfo = true;
  }

  private _onCloseMimeInfo(): void {
    this._trackedAliases.length && this._pushSeparator();
    this._trackedAliases.forEach((tracked: MimeInfoTrackedAlias) => {
      tracked &&
        tracked.aliases &&
        tracked.aliases
          .filter((alias: string) => !this._trackedMimeType(alias))
          .forEach((alias: string, index: number, array: string[]) => {
            this._pushItem(this._trackMimeType(alias), tracked.item);
            index !== array.length - 1 && this._pushSeparator();
          });
    });
    this._openMimeInfo = false;
    this._pushEnd();
  }

  private _pushStart(): void {
    this.push('{\n');
  }

  private _pushEnd(): void {
    this._mimeTypes.length && this.push('\n}\n');
    this.push(null);
  }

  private _pushSeparator(): void {
    this.push(',\n');
  }

  private _pushItem(
    key: string | null,
    data: MimeInfoItem | MimeInfoTrackedAlias | null
  ): void {
    this.push(
      '  ' + JSON.stringify(key) + ': ' + JSON.stringify(data, null, 4)
    );
  }

  private _onOpenMimeType(tag: Tag): void {
    const type = tag.attributes.type;
    this._trackedMimeType(type) || this._addMimeType(type);
  }

  private _addMimeType(type: string): void {
    this._mimeTypes.length ? this._pushSeparator() : this._pushStart();
    this._openMimeType = this._trackMimeType(type);
  }

  private _onCloseMimeType(): void {
    this._pushItem(this._openMimeType, this._item);
    const aliases = this._aliases;
    if (aliases.length) {
      this._trackedAliases.push({
        aliases,
        item: this._item,
      });
    }
    this._openMimeType = null;
    this._item = null;
    this._aliases = [];
  }

  private _onOpenMimeTypeComment(): void {
    this._openComment = true;
  }

  private _onCloseMimeTypeComment(): void {
    this._openComment = false;
  }

  private _onCommentText(comment: string): void {
    this._item = {
      ...this._item,
      comment,
    };
  }

  private _onOpenMimeTypeAlias(tag: Tag): void {
    this._openAlias = tag.attributes.type;
    this._aliases.push(this._openAlias);
  }

  private _onCloseMimeTypeAlias(): void {
    this._openAlias = '';
  }

  private _onOpenAcronym(): void {
    this._openAcronym = true;
  }

  private _onCloseAcronym(): void {
    this._openAcronym = false;
  }

  private _onAcronymText(acronym: string): void {
    this._item = {
      ...this._item,
      acronym,
    } as MimeInfoItem;
  }

  private _onOpenExpandedAcronym(): void {
    this._openAcronymExpanded = true;
  }

  private _onCloseExpandedAcronym(): void {
    this._openAcronymExpanded = false;
  }

  private _onAcronymExpandedText(acronymExpanded: string): void {
    this._item = {
      ...this._item,
      acronymExpanded,
    } as MimeInfoItem;
  }

  private _trackMimeType(type: string): string {
    this._mimeTypes.push(type);
    return type;
  }

  private _trackedMimeType(type: string): boolean {
    return !type || (this._mimeTypes && this._mimeTypes.includes(type));
  }
}
