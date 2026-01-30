/* eslint-disable no-underscore-dangle */
/**
 * Screen class for building WhatsApp Flow screens
 *
 * @example
 * ```typescript
 * import { Screen, TextInput, Footer, DataExchangeAction } from '@awadoc/whatsapp-cloud-api/flows';
 *
 * const screen = new Screen('FORM')
 *   .setTitle('Contact Form')
 *   .setData({
 *     prefilled_name: { type: 'string', __example__: 'John' },
 *   })
 *   .addComponent(
 *     new TextInput('name', 'Your Name')
 *       .setRequired()
 *       .setInitValue('${data.prefilled_name}')
 *   )
 *   .addComponent(
 *     new Footer('Submit', new DataExchangeAction({ name: '${form.name}' }))
 *   );
 * ```
 */
import type {
  ScreenSchema,
  DataSource,
  ComponentSchema,
} from './types';
import { Layout } from './Layout';

/**
 * Interface for components that can be added to a screen
 */
export interface ScreenComponent {
  toJSON(): ComponentSchema;
}

/**
 * Class representing a screen in a WhatsApp Flow
 */
export class Screen {
  private readonly _id: string;

  private _title?: string;

  private _terminal: boolean = false;

  private _refreshOnBack: boolean = false;

  private _data?: Record<string, DataSource>;

  private readonly _layout: Layout;

  /**
   * Create a new Screen instance
   *
   * @param id - Unique screen identifier (e.g., 'WELCOME', 'FORM')
   */
  constructor(id: string) {
    this._id = id;
    this._layout = new Layout();
  }

  /**
   * Get the screen ID
   */
  get id(): string {
    return this._id;
  }

  /**
   * Get the layout
   */
  get layout(): Layout {
    return this._layout;
  }

  /**
   * Set the screen title displayed in the header
   *
   * @param title - Screen title
   * @returns this for chaining
   */
  setTitle(title: string): this {
    this._title = title;
    return this;
  }

  /**
   * Mark this screen as a terminal screen
   *
   * Terminal screens end the flow when navigated to.
   *
   * @param terminal - Whether this is a terminal screen (default: true)
   * @returns this for chaining
   */
  setTerminal(terminal: boolean = true): this {
    this._terminal = terminal;
    return this;
  }

  /**
   * Enable refresh when user navigates back to this screen
   *
   * When enabled, a data_exchange request is made when the user
   * presses the back button to return to this screen.
   *
   * @param refresh - Whether to refresh on back (default: true)
   * @returns this for chaining
   */
  setRefreshOnBack(refresh: boolean = true): this {
    this._refreshOnBack = refresh;
    return this;
  }

  /**
   * Set screen data declarations
   *
   * Data declarations define the shape of data passed to the screen
   * via navigate or data_exchange actions.
   *
   * @param data - Map of data keys to their type definitions
   * @returns this for chaining
   *
   * @example
   * ```typescript
   * screen.setData({
   *   user_name: { type: 'string', __example__: 'John' },
   *   user_age: { type: 'number', __example__: 25 },
   *   options: { type: 'array', __example__: ['A', 'B', 'C'] },
   * });
   * ```
   */
  setData(data: Record<string, DataSource>): this {
    this._data = data;
    return this;
  }

  /**
   * Add a single data declaration
   *
   * @param key - Data key
   * @param source - Data source definition
   * @returns this for chaining
   */
  addData(key: string, source: DataSource): this {
    if (!this._data) {
      this._data = {};
    }
    this._data[key] = source;
    return this;
  }

  /**
   * Add a component to the screen layout
   *
   * @param component - Component to add
   * @returns this for chaining
   */
  addComponent(component: ScreenComponent): this {
    this._layout.addChild(component);
    return this;
  }

  /**
   * Add multiple components to the screen layout
   *
   * @param components - Components to add
   * @returns this for chaining
   */
  addComponents(...components: ScreenComponent[]): this {
    components.forEach((c) => this._layout.addChild(c));
    return this;
  }

  /**
   * Convert to JSON schema object
   *
   * @returns ScreenSchema object
   */
  toJSON(): ScreenSchema {
    const result: ScreenSchema = {
      id: this._id,
      layout: this._layout.toJSON(),
    };

    if (this._title !== undefined) {
      result.title = this._title;
    }

    if (this._terminal) {
      result.terminal = this._terminal;
    }

    if (this._refreshOnBack) {
      result.refresh_on_back = this._refreshOnBack;
    }

    if (this._data !== undefined) {
      result.data = this._data;
    }

    return result;
  }
}
