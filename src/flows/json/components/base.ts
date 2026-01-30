/* eslint-disable no-underscore-dangle, max-classes-per-file */
/**
 * Base component class for WhatsApp Flow components
 */
import type { DynamicRef } from '../types';

/**
 * Base properties for components with visibility control (excludes type)
 */
export interface ComponentBaseProps {
  visible?: boolean | DynamicRef;
}

/**
 * Abstract base class for all flow components
 */
export abstract class Component {
  protected _visible?: boolean | DynamicRef;

  /**
   * Set visibility condition
   *
   * @param visible - Boolean or dynamic reference
   * @returns this for chaining
   */
  setVisible(visible: boolean | DynamicRef): this {
    this._visible = visible;
    return this;
  }

  /**
   * Get base properties shared by all components (excludes type)
   *
   * @returns Base properties object
   */
  protected baseProps(): ComponentBaseProps {
    const props: ComponentBaseProps = {};
    if (this._visible !== undefined) {
      props.visible = this._visible;
    }
    return props;
  }

  /**
   * Convert component to JSON schema
   */
  abstract toJSON(): object;
}

/**
 * Base class for form field components
 */
export abstract class FormFieldComponent<N extends string = string> extends Component {
  protected _required?: boolean;

  protected _enabled?: boolean | DynamicRef;

  protected _errorMessage?: string | DynamicRef;

  constructor(public readonly name: N) {
    super();
  }

  /**
   * Mark field as required
   *
   * @param required - Whether field is required (default: true)
   * @returns this for chaining
   */
  setRequired(required: boolean = true): this {
    this._required = required;
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
   * Set error message to display
   *
   * @param message - Error message or dynamic reference
   * @returns this for chaining
   */
  setErrorMessage(message: string | DynamicRef): this {
    this._errorMessage = message;
    return this;
  }

  /**
   * Get base form field properties
   *
   * @returns Form field base properties
   */
  protected formFieldBaseProps(): object {
    const props: Record<string, unknown> = {
      ...this.baseProps(),
    };

    if (this._required !== undefined) {
      props.required = this._required;
    }
    if (this._enabled !== undefined) {
      props.enabled = this._enabled;
    }
    if (this._errorMessage !== undefined) {
      props['error-message'] = this._errorMessage;
    }

    return props;
  }
}
