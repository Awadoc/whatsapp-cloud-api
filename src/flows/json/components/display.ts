/* eslint-disable no-underscore-dangle, max-classes-per-file */
/**
 * Display components for WhatsApp Flows
 */
import type {
  TextHeadingSchema,
  TextSubheadingSchema,
  TextBodySchema,
  ImageSchema,
  TextCaptionSchema,
  DynamicRef,
} from '../types';
import { Component } from './base';

/**
 * TextHeading component for large heading text
 *
 * @example
 * ```typescript
 * // Static heading
 * new TextHeading('Welcome to Our Service')
 *
 * // Dynamic heading
 * new TextHeading('Hello, ${data.user_name}!')
 * ```
 */
export class TextHeading extends Component {
  protected readonly type = 'TextHeading' as const;

  /**
   * Create a text heading component
   *
   * @param text - Heading text or dynamic reference
   */
  constructor(private readonly text: string | DynamicRef) {
    super();
  }

  /**
   * Convert to JSON schema
   */
  toJSON(): TextHeadingSchema {
    return {
      type: this.type,
      text: this.text,
      ...this.baseProps(),
    };
  }
}

/**
 * TextSubheading component for medium-sized subheading text
 *
 * @example
 * ```typescript
 * new TextSubheading('Step 1 of 3')
 * ```
 */
export class TextSubheading extends Component {
  protected readonly type = 'TextSubheading' as const;

  /**
   * Create a text subheading component
   *
   * @param text - Subheading text or dynamic reference
   */
  constructor(private readonly text: string | DynamicRef) {
    super();
  }

  /**
   * Convert to JSON schema
   */
  toJSON(): TextSubheadingSchema {
    return {
      type: this.type,
      text: this.text,
      ...this.baseProps(),
    };
  }
}

/**
 * TextBody component for body text
 *
 * @example
 * ```typescript
 * // Simple text
 * new TextBody('Please fill out the form below.')
 *
 * // Bold text
 * new TextBody('Important: Read carefully')
 *   .setBold()
 *
 * // Strikethrough text (for prices, etc.)
 * new TextBody('$99.99')
 *   .setStrikethrough()
 * ```
 */
export class TextBody extends Component {
  protected readonly type = 'TextBody' as const;

  private _fontWeight?: 'normal' | 'bold';

  private _strikethrough?: boolean;

  /**
   * Create a text body component
   *
   * @param text - Body text or dynamic reference
   */
  constructor(private readonly text: string | DynamicRef) {
    super();
  }

  /**
   * Set font weight to bold
   *
   * @param bold - Whether to use bold (default: true)
   * @returns this for chaining
   */
  setBold(bold: boolean = true): this {
    this._fontWeight = bold ? 'bold' : 'normal';
    return this;
  }

  /**
   * Set font weight
   *
   * @param weight - Font weight
   * @returns this for chaining
   */
  setFontWeight(weight: 'normal' | 'bold'): this {
    this._fontWeight = weight;
    return this;
  }

  /**
   * Enable strikethrough text
   *
   * @param strikethrough - Whether to strikethrough (default: true)
   * @returns this for chaining
   */
  setStrikethrough(strikethrough: boolean = true): this {
    this._strikethrough = strikethrough;
    return this;
  }

  /**
   * Convert to JSON schema
   */
  toJSON(): TextBodySchema {
    const result: TextBodySchema = {
      type: this.type,
      text: this.text,
      ...this.baseProps(),
    };

    if (this._fontWeight !== undefined) {
      result['font-weight'] = this._fontWeight;
    }
    if (this._strikethrough !== undefined) {
      result.strikethrough = this._strikethrough;
    }

    return result;
  }
}

/**
 * Image component for displaying images
 *
 * @example
 * ```typescript
 * // Basic image
 * new Image('https://example.com/logo.png')
 *   .setAltText('Company Logo')
 *
 * // Image with dimensions
 * new Image('https://example.com/banner.jpg')
 *   .setWidth(300)
 *   .setHeight(150)
 *   .setScaleType('cover')
 *
 * // Image with aspect ratio
 * new Image('${data.product_image}')
 *   .setAspectRatio(16/9)
 *   .setAltText('Product Image')
 * ```
 */
export class Image extends Component {
  protected readonly type = 'Image' as const;

  private _width?: number;

  private _height?: number;

  private _scaleType?: 'cover' | 'contain';

  private _aspectRatio?: number;

  private _altText?: string;

  /**
   * Create an image component
   *
   * @param src - Image URL or dynamic reference
   */
  constructor(private readonly src: string | DynamicRef) {
    super();
  }

  /**
   * Set image width
   *
   * @param width - Width in pixels
   * @returns this for chaining
   */
  setWidth(width: number): this {
    this._width = width;
    return this;
  }

  /**
   * Set image height
   *
   * @param height - Height in pixels
   * @returns this for chaining
   */
  setHeight(height: number): this {
    this._height = height;
    return this;
  }

  /**
   * Set image scale type
   *
   * @param scaleType - How to scale the image
   * @returns this for chaining
   */
  setScaleType(scaleType: 'cover' | 'contain'): this {
    this._scaleType = scaleType;
    return this;
  }

  /**
   * Set image aspect ratio
   *
   * @param ratio - Aspect ratio (width/height)
   * @returns this for chaining
   */
  setAspectRatio(ratio: number): this {
    this._aspectRatio = ratio;
    return this;
  }

  /**
   * Set alt text for accessibility
   *
   * @param text - Alt text description
   * @returns this for chaining
   */
  setAltText(text: string): this {
    this._altText = text;
    return this;
  }

  /**
   * Convert to JSON schema
   */
  toJSON(): ImageSchema {
    const result: ImageSchema = {
      type: this.type,
      src: this.src,
      ...this.baseProps(),
    };

    if (this._width !== undefined) {
      result.width = this._width;
    }
    if (this._height !== undefined) {
      result.height = this._height;
    }
    if (this._scaleType !== undefined) {
      result['scale-type'] = this._scaleType;
    }
    if (this._aspectRatio !== undefined) {
      result['aspect-ratio'] = this._aspectRatio;
    }
    if (this._altText !== undefined) {
      result['alt-text'] = this._altText;
    }

    return result;
  }
}

/**
 * TextCaption component for small caption text
 *
 * @example
 * ```typescript
 * new TextCaption('Terms and conditions apply')
 * ```
 */
export class TextCaption extends Component {
  protected readonly type = 'TextCaption' as const;

  /**
   * Create a text caption component
   *
   * @param text - Caption text or dynamic reference
   */
  constructor(private readonly text: string | DynamicRef) {
    super();
  }

  /**
   * Convert to JSON schema
   */
  toJSON(): TextCaptionSchema {
    return {
      type: this.type,
      text: this.text,
      ...this.baseProps(),
    };
  }
}
