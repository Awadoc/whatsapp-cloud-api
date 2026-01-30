/* eslint-disable no-underscore-dangle, max-classes-per-file */
/**
 * Navigation components for WhatsApp Flows
 */
import type {
  FooterSchema,
  EmbeddedLinkSchema,
  ActionSchema,
  DynamicRef,
} from '../types';
import { Component } from './base';
import type { Action } from './actions';

/**
 * Footer component for screen navigation/submission buttons
 *
 * @example
 * ```typescript
 * // Navigate to next screen
 * new Footer('Continue', new NavigateAction('NEXT_SCREEN'))
 *
 * // Submit data to endpoint
 * new Footer('Submit', new DataExchangeAction({
 *   name: '${form.name}',
 *   email: '${form.email}',
 * }))
 *
 * // Complete the flow
 * new Footer('Finish', new CompleteAction({ status: 'completed' }))
 *
 * // With captions
 * new Footer('Book Now', new DataExchangeAction({ date: '${form.date}' }))
 *   .setLeftCaption('Step 2 of 3')
 *   .setCenterCaption('${data.price}')
 * ```
 */
export class Footer extends Component {
  protected readonly type = 'Footer' as const;

  private _leftCaption?: string | DynamicRef;

  private _centerCaption?: string | DynamicRef;

  private _enabled?: boolean | DynamicRef;

  /**
   * Create a footer component
   *
   * @param label - Button label text
   * @param action - Action to perform on click
   */
  constructor(
    private readonly label: string | DynamicRef,
    private readonly action: Action,
  ) {
    super();
  }

  /**
   * Set left caption text
   *
   * @param caption - Caption text or dynamic reference
   * @returns this for chaining
   */
  setLeftCaption(caption: string | DynamicRef): this {
    this._leftCaption = caption;
    return this;
  }

  /**
   * Set center caption text
   *
   * @param caption - Caption text or dynamic reference
   * @returns this for chaining
   */
  setCenterCaption(caption: string | DynamicRef): this {
    this._centerCaption = caption;
    return this;
  }

  /**
   * Set enabled state
   *
   * @param enabled - Boolean or dynamic reference
   * @returns this for chaining
   */
  setEnabled(enabled: boolean | DynamicRef): this {
    this._enabled = enabled;
    return this;
  }

  /**
   * Convert to JSON schema
   */
  toJSON(): FooterSchema {
    const result: FooterSchema = {
      type: this.type,
      label: this.label,
      'on-click-action': this.action.toJSON() as ActionSchema,
      ...this.baseProps(),
    };

    if (this._leftCaption !== undefined) {
      result['left-caption'] = this._leftCaption;
    }
    if (this._centerCaption !== undefined) {
      result['center-caption'] = this._centerCaption;
    }
    if (this._enabled !== undefined) {
      result.enabled = this._enabled;
    }

    return result;
  }
}

/**
 * EmbeddedLink component for inline clickable text
 *
 * @example
 * ```typescript
 * // Navigate to another screen
 * new EmbeddedLink('Skip this step', new NavigateAction('SKIP_SCREEN'))
 *
 * // Open external URL
 * new EmbeddedLink('Terms & Conditions', new OpenUrlAction('https://example.com/terms'))
 *
 * // Submit via data exchange
 * new EmbeddedLink('I already have an account', new DataExchangeAction({
 *   action: 'existing_user'
 * }))
 * ```
 */
export class EmbeddedLink extends Component {
  protected readonly type = 'EmbeddedLink' as const;

  /**
   * Create an embedded link component
   *
   * @param text - Link text or dynamic reference
   * @param action - Action to perform on click
   */
  constructor(
    private readonly text: string | DynamicRef,
    private readonly action: Action,
  ) {
    super();
  }

  /**
   * Convert to JSON schema
   */
  toJSON(): EmbeddedLinkSchema {
    return {
      type: this.type,
      text: this.text,
      'on-click-action': this.action.toJSON() as ActionSchema,
      ...this.baseProps(),
    };
  }
}
