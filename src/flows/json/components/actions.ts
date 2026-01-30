/* eslint-disable max-classes-per-file */
/**
 * Action classes for WhatsApp Flow navigation and data exchange
 */
import type {
  NavigateActionSchema,
  DataExchangeActionSchema,
  CompleteActionSchema,
  OpenUrlActionSchema,
  DynamicRef,
} from '../types';

/**
 * Navigate action - navigate to another screen
 *
 * @example
 * ```typescript
 * // Navigate to a screen
 * new Footer('Next', new NavigateAction('NEXT_SCREEN'))
 *
 * // Navigate with data
 * new Footer('Next', new NavigateAction('DETAILS', {
 *   name: '${form.name}',
 *   email: '${form.email}',
 * }))
 * ```
 */
export class NavigateAction {
  /**
   * Create a navigate action
   *
   * @param screenName - Target screen ID
   * @param payload - Optional data to pass to the screen
   */
  constructor(
    private readonly screenName: string,
    private readonly payload?: Record<string, unknown>,
  ) {}

  /**
   * Convert to JSON schema
   */
  toJSON(): NavigateActionSchema {
    const result: NavigateActionSchema = {
      name: 'navigate',
      next: {
        type: 'screen',
        name: this.screenName,
      },
    };

    if (this.payload !== undefined) {
      result.payload = this.payload;
    }

    return result;
  }
}

/**
 * Data exchange action - send data to the endpoint
 *
 * @example
 * ```typescript
 * // Submit form data to endpoint
 * new Footer('Submit', new DataExchangeAction({
 *   name: '${form.name}',
 *   email: '${form.email}',
 *   preference: '${form.preference}',
 * }))
 * ```
 */
export class DataExchangeAction {
  /**
   * Create a data exchange action
   *
   * @param payload - Data to send to the endpoint
   */
  constructor(private readonly payload?: Record<string, unknown>) {}

  /**
   * Convert to JSON schema
   */
  toJSON(): DataExchangeActionSchema {
    const result: DataExchangeActionSchema = {
      name: 'data_exchange',
    };

    if (this.payload !== undefined) {
      result.payload = this.payload;
    }

    return result;
  }
}

/**
 * Complete action - complete the flow and close it
 *
 * @example
 * ```typescript
 * // Complete with summary data
 * new Footer('Finish', new CompleteAction({
 *   booking_id: '${data.booking_id}',
 *   confirmation: 'confirmed',
 * }))
 * ```
 */
export class CompleteAction {
  /**
   * Create a complete action
   *
   * @param payload - Data to include in the completion message
   */
  constructor(private readonly payload?: Record<string, unknown>) {}

  /**
   * Convert to JSON schema
   */
  toJSON(): CompleteActionSchema {
    const result: CompleteActionSchema = {
      name: 'complete',
    };

    if (this.payload !== undefined) {
      result.payload = this.payload;
    }

    return result;
  }
}

/**
 * Open URL action - open a URL in the browser
 *
 * @example
 * ```typescript
 * // Open a static URL
 * new EmbeddedLink('Terms & Conditions', new OpenUrlAction('https://example.com/terms'))
 *
 * // Open a dynamic URL
 * new EmbeddedLink('View Details', new OpenUrlAction('${data.details_url}'))
 * ```
 */
export class OpenUrlAction {
  /**
   * Create an open URL action
   *
   * @param url - URL to open (static or dynamic reference)
   */
  constructor(private readonly url: string | DynamicRef) {}

  /**
   * Convert to JSON schema
   */
  toJSON(): OpenUrlActionSchema {
    return {
      name: 'open_url',
      url: this.url,
    };
  }
}

/**
 * Union type for all action classes
 */
export type Action = NavigateAction | DataExchangeAction | CompleteAction | OpenUrlAction;
