/* eslint-disable no-underscore-dangle, max-classes-per-file */
/**
 * Input components for WhatsApp Flows
 */
import type {
  TextInputSchema,
  TextAreaSchema,
  DynamicRef,
  FormRef,
} from '../types';
import { FormFieldComponent } from './base';

/**
 * Input types for TextInput component
 */
export type TextInputType = 'text' | 'number' | 'email' | 'password' | 'passcode' | 'phone';

/**
 * TextInput component for single-line text input
 *
 * @example
 * ```typescript
 * // Basic text input
 * new TextInput('name', 'Your Name')
 *   .setRequired()
 *
 * // Email input with validation
 * new TextInput('email', 'Email Address')
 *   .setInputType('email')
 *   .setRequired()
 *   .setHelperText('We will send confirmation here')
 *
 * // Phone number input
 * new TextInput('phone', 'Phone Number')
 *   .setInputType('phone')
 *   .setInitValue('${data.prefilled_phone}')
 * ```
 */
export class TextInput<N extends string = string> extends FormFieldComponent<N> {
  protected readonly type = 'TextInput' as const;

  private _inputType?: TextInputType;

  private _minChars?: number;

  private _maxChars?: number;

  private _helperText?: string | DynamicRef;

  private _initValue?: string | DynamicRef;

  /**
   * Create a text input component
   *
   * @param name - Field name (used in form.{name} references)
   * @param label - Display label
   */
  constructor(
    name: N,
    private readonly label: string | DynamicRef,
  ) {
    super(name);
  }

  /**
   * Get a reference to this field's value
   *
   * Use this in action payloads to reference the field value.
   *
   * @example
   * ```typescript
   * const nameInput = new TextInput('name', 'Name');
   * new DataExchangeAction({ name: nameInput.ref }) // => ${form.name}
   * ```
   */
  get ref(): FormRef<N> {
    return `\${form.${this.name}}` as FormRef<N>;
  }

  /**
   * Set the input type (affects keyboard and validation)
   *
   * @param type - Input type
   * @returns this for chaining
   */
  setInputType(type: TextInputType): this {
    this._inputType = type;
    return this;
  }

  /**
   * Set minimum character count
   *
   * @param min - Minimum characters required
   * @returns this for chaining
   */
  setMinChars(min: number): this {
    this._minChars = min;
    return this;
  }

  /**
   * Set maximum character count
   *
   * @param max - Maximum characters allowed
   * @returns this for chaining
   */
  setMaxChars(max: number): this {
    this._maxChars = max;
    return this;
  }

  /**
   * Set helper text displayed below the input
   *
   * @param text - Helper text or dynamic reference
   * @returns this for chaining
   */
  setHelperText(text: string | DynamicRef): this {
    this._helperText = text;
    return this;
  }

  /**
   * Set initial value
   *
   * @param value - Initial value or dynamic reference
   * @returns this for chaining
   */
  setInitValue(value: string | DynamicRef): this {
    this._initValue = value;
    return this;
  }

  /**
   * Convert to JSON schema
   */
  toJSON(): TextInputSchema {
    const result: TextInputSchema = {
      type: this.type,
      name: this.name,
      label: this.label,
      ...this.formFieldBaseProps(),
    };

    if (this._inputType !== undefined) {
      result['input-type'] = this._inputType;
    }
    if (this._minChars !== undefined) {
      result['min-chars'] = this._minChars;
    }
    if (this._maxChars !== undefined) {
      result['max-chars'] = this._maxChars;
    }
    if (this._helperText !== undefined) {
      result['helper-text'] = this._helperText;
    }
    if (this._initValue !== undefined) {
      result['init-value'] = this._initValue;
    }

    return result;
  }
}

/**
 * TextArea component for multi-line text input
 *
 * @example
 * ```typescript
 * new TextArea('feedback', 'Your Feedback')
 *   .setMaxLength(500)
 *   .setHelperText('Tell us what you think')
 *   .setRequired()
 * ```
 */
export class TextArea<N extends string = string> extends FormFieldComponent<N> {
  protected readonly type = 'TextArea' as const;

  private _maxLength?: number;

  private _helperText?: string | DynamicRef;

  private _initValue?: string | DynamicRef;

  /**
   * Create a text area component
   *
   * @param name - Field name
   * @param label - Display label
   */
  constructor(
    name: N,
    private readonly label: string | DynamicRef,
  ) {
    super(name);
  }

  /**
   * Get a reference to this field's value
   */
  get ref(): FormRef<N> {
    return `\${form.${this.name}}` as FormRef<N>;
  }

  /**
   * Set maximum length
   *
   * @param max - Maximum characters allowed
   * @returns this for chaining
   */
  setMaxLength(max: number): this {
    this._maxLength = max;
    return this;
  }

  /**
   * Set helper text
   *
   * @param text - Helper text or dynamic reference
   * @returns this for chaining
   */
  setHelperText(text: string | DynamicRef): this {
    this._helperText = text;
    return this;
  }

  /**
   * Set initial value
   *
   * @param value - Initial value or dynamic reference
   * @returns this for chaining
   */
  setInitValue(value: string | DynamicRef): this {
    this._initValue = value;
    return this;
  }

  /**
   * Convert to JSON schema
   */
  toJSON(): TextAreaSchema {
    const result: TextAreaSchema = {
      type: this.type,
      name: this.name,
      label: this.label,
      ...this.formFieldBaseProps(),
    };

    if (this._maxLength !== undefined) {
      result['max-length'] = this._maxLength;
    }
    if (this._helperText !== undefined) {
      result['helper-text'] = this._helperText;
    }
    if (this._initValue !== undefined) {
      result['init-value'] = this._initValue;
    }

    return result;
  }
}
