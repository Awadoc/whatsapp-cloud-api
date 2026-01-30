/* eslint-disable no-underscore-dangle */
/**
 * FlowJSON class for building WhatsApp Flow definitions
 *
 * @example
 * ```typescript
 * import {
 *   FlowJSON, Screen, TextInput, Footer, DataExchangeAction,
 * } from '@awadoc/whatsapp-cloud-api/flows';
 *
 * const flow = new FlowJSON('3.0')
 *   .setDataApiVersion('3.0')
 *   .addScreen(
 *     new Screen('WELCOME')
 *       .setTitle('Welcome')
 *       .addComponent(new TextHeading('Hello!'))
 *       .addComponent(
 *         new Footer('Continue', new NavigateAction('FORM'))
 *       )
 *   )
 *   .addScreen(
 *     new Screen('FORM')
 *       .setTitle('Your Details')
 *       .addComponent(new TextInput('name', 'Your Name').setRequired())
 *       .addComponent(
 *         new Footer('Submit', new DataExchangeAction({ name: '${form.name}' }))
 *       )
 *   );
 *
 * // Use with FlowManager
 * await flowManager.updateJson(flowId, flow);
 * ```
 */
import * as fs from 'fs';
import type {
  FlowVersion,
  DataApiVersion,
  FlowJSONSchema,
} from './types';
import type { Screen } from './Screen';

/**
 * Main class for building WhatsApp Flow JSON definitions
 */
export class FlowJSON {
  private readonly _version: FlowVersion;

  private _dataApiVersion?: DataApiVersion;

  private _routingModel?: Record<string, string[]>;

  private readonly _screens: Screen[] = [];

  /**
   * Create a new FlowJSON instance
   *
   * @param version - Flow JSON version (default: '3.0')
   */
  constructor(version: FlowVersion = '3.0') {
    this._version = version;
  }

  /**
   * Get the flow version
   */
  get version(): FlowVersion {
    return this._version;
  }

  /**
   * Get the screens array (readonly)
   */
  get screens(): readonly Screen[] {
    return this._screens;
  }

  /**
   * Set the data API version for data exchange
   *
   * @param version - Data API version ('3.0' or '4.0')
   * @returns this for chaining
   */
  setDataApiVersion(version: DataApiVersion): this {
    this._dataApiVersion = version;
    return this;
  }

  /**
   * Set the routing model for screen navigation
   *
   * The routing model defines allowed transitions between screens.
   *
   * @param model - Map of screen IDs to allowed next screen IDs
   * @returns this for chaining
   *
   * @example
   * ```typescript
   * flow.setRoutingModel({
   *   'WELCOME': ['FORM', 'HELP'],
   *   'FORM': ['SUCCESS', 'ERROR'],
   * });
   * ```
   */
  setRoutingModel(model: Record<string, string[]>): this {
    this._routingModel = model;
    return this;
  }

  /**
   * Add a screen to the flow
   *
   * @param screen - Screen instance to add
   * @returns this for chaining
   */
  addScreen(screen: Screen): this {
    this._screens.push(screen);
    return this;
  }

  /**
   * Add multiple screens to the flow
   *
   * @param screens - Screen instances to add
   * @returns this for chaining
   */
  addScreens(...screens: Screen[]): this {
    this._screens.push(...screens);
    return this;
  }

  /**
   * Convert to JSON schema object
   *
   * @returns FlowJSONSchema object
   */
  toJSON(): FlowJSONSchema {
    const result: FlowJSONSchema = {
      version: this._version,
      screens: this._screens.map((screen) => screen.toJSON()),
    };

    if (this._dataApiVersion !== undefined) {
      result.data_api_version = this._dataApiVersion;
    }

    if (this._routingModel !== undefined) {
      result.routing_model = this._routingModel;
    }

    return result;
  }

  /**
   * Convert to formatted JSON string
   *
   * @param indent - Indentation spaces (default: 2)
   * @returns JSON string
   */
  toString(indent: number = 2): string {
    return JSON.stringify(this.toJSON(), null, indent);
  }

  /**
   * Save flow JSON to a file
   *
   * @param filePath - Path to save the file
   * @param indent - Indentation spaces (default: 2)
   */
  saveToFile(filePath: string, indent: number = 2): void {
    fs.writeFileSync(filePath, this.toString(indent), 'utf-8');
  }

  /**
   * Create a FlowJSON instance from a JSON schema object
   *
   * Note: This creates a FlowJSON with the version set but doesn't
   * reconstruct Screen objects. Use this primarily for version checking.
   *
   * @param json - FlowJSONSchema object or JSON string
   * @returns FlowJSON instance
   */
  static fromJSON(json: FlowJSONSchema | string): FlowJSON {
    const parsed: FlowJSONSchema = typeof json === 'string' ? JSON.parse(json) : json;
    const flow = new FlowJSON(parsed.version);

    if (parsed.data_api_version) {
      flow.setDataApiVersion(parsed.data_api_version);
    }

    if (parsed.routing_model) {
      flow.setRoutingModel(parsed.routing_model);
    }

    // Note: Screens are not reconstructed as Screen objects
    // This is intentional - use raw JSON if you need to modify existing flows

    return flow;
  }

  /**
   * Load flow JSON from a file
   *
   * @param filePath - Path to the JSON file
   * @returns FlowJSON instance
   */
  static fromFile(filePath: string): FlowJSON {
    const content = fs.readFileSync(filePath, 'utf-8');
    return FlowJSON.fromJSON(content);
  }
}
