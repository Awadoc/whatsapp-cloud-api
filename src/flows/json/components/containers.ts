/* eslint-disable no-underscore-dangle */
/**
 * Container components for WhatsApp Flows
 */
import type {
  FormSchema,
  ComponentSchema,
  DynamicRef,
} from '../types';
import { Component } from './base';

/**
 * Interface for components that can be added to a form
 */
export interface FormComponent {
  toJSON(): ComponentSchema;
}

/**
 * Form component for grouping form fields
 *
 * @example
 * ```typescript
 * const form = new Form('contact_form')
 *   .addChild(new TextInput('name', 'Your Name').setRequired())
 *   .addChild(new TextInput('email', 'Email').setInputType('email'))
 *   .addChild(new TextArea('message', 'Your Message'))
 *   .setInitValues({
 *     name: '${data.prefilled_name}',
 *   })
 *   .setErrorMessages({
 *     name: '${data.name_error}',
 *     email: '${data.email_error}',
 *   });
 * ```
 */
export class Form extends Component {
  protected readonly type = 'Form' as const;

  private readonly _children: FormComponent[] = [];

  private _initValues?: Record<string, unknown>;

  private _errorMessages?: Record<string, string | DynamicRef>;

  /**
   * Create a form component
   *
   * @param name - Form name (used for referencing form fields)
   */
  constructor(private readonly name: string) {
    super();
  }

  /**
   * Add a child component to the form
   *
   * @param component - Component to add
   * @returns this for chaining
   */
  addChild(component: FormComponent): this {
    this._children.push(component);
    return this;
  }

  /**
   * Add multiple child components to the form
   *
   * @param components - Components to add
   * @returns this for chaining
   */
  addChildren(...components: FormComponent[]): this {
    this._children.push(...components);
    return this;
  }

  /**
   * Set initial values for form fields
   *
   * @param values - Map of field names to initial values
   * @returns this for chaining
   *
   * @example
   * ```typescript
   * form.setInitValues({
   *   name: 'John Doe',
   *   email: '${data.user_email}',
   * });
   * ```
   */
  setInitValues(values: Record<string, unknown>): this {
    this._initValues = values;
    return this;
  }

  /**
   * Set error messages for form fields
   *
   * @param messages - Map of field names to error messages
   * @returns this for chaining
   *
   * @example
   * ```typescript
   * form.setErrorMessages({
   *   name: '${data.name_error}',
   *   email: 'Please enter a valid email',
   * });
   * ```
   */
  setErrorMessages(messages: Record<string, string | DynamicRef>): this {
    this._errorMessages = messages;
    return this;
  }

  /**
   * Convert to JSON schema
   */
  toJSON(): FormSchema {
    const result: FormSchema = {
      type: this.type,
      name: this.name,
      children: this._children.map((child) => child.toJSON()),
      ...this.baseProps(),
    };

    if (this._initValues !== undefined) {
      result['init-values'] = this._initValues;
    }
    if (this._errorMessages !== undefined) {
      result['error-messages'] = this._errorMessages;
    }

    return result;
  }
}
