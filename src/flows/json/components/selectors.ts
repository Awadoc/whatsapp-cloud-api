/* eslint-disable no-underscore-dangle, max-classes-per-file */
/**
 * Selector components for WhatsApp Flows
 */
import type {
  DropdownSchema,
  DropdownOptionSchema,
  RadioButtonsGroupSchema,
  RadioOptionSchema,
  CheckboxGroupSchema,
  CheckboxOptionSchema,
  DynamicRef,
  FormRef,
} from '../types';
import { FormFieldComponent } from './base';

/**
 * Dropdown component for single selection from a list
 *
 * @example
 * ```typescript
 * // Static options
 * new Dropdown('country', 'Select Country', [
 *   { id: 'us', title: 'United States' },
 *   { id: 'uk', title: 'United Kingdom' },
 *   { id: 'ca', title: 'Canada' },
 * ]).setRequired()
 *
 * // Dynamic options from data
 * new Dropdown('product', 'Select Product', '${data.products}')
 * ```
 */
export class Dropdown<N extends string = string> extends FormFieldComponent<N> {
  protected readonly type = 'Dropdown' as const;

  private _initValue?: string | DynamicRef;

  /**
   * Create a dropdown component
   *
   * @param name - Field name
   * @param label - Display label
   * @param dataSource - Static options array or dynamic reference
   */
  constructor(
    name: N,
    private readonly label: string | DynamicRef,
    private readonly dataSource: DynamicRef | readonly DropdownOptionSchema[],
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
   * Set initial selected value
   *
   * @param value - Option ID or dynamic reference
   * @returns this for chaining
   */
  setInitValue(value: string | DynamicRef): this {
    this._initValue = value;
    return this;
  }

  /**
   * Convert to JSON schema
   */
  toJSON(): DropdownSchema {
    const result: DropdownSchema = {
      type: this.type,
      name: this.name,
      label: this.label,
      'data-source': this.dataSource as DynamicRef | DropdownOptionSchema[],
      ...this.formFieldBaseProps(),
    };

    if (this._initValue !== undefined) {
      result['init-value'] = this._initValue;
    }

    return result;
  }
}

/**
 * RadioButtonsGroup component for single selection with radio buttons
 *
 * @example
 * ```typescript
 * new RadioButtonsGroup('size', 'Select Size', [
 *   { id: 'small', title: 'Small', description: 'Best for personal use' },
 *   { id: 'medium', title: 'Medium', description: 'For small teams' },
 *   { id: 'large', title: 'Large', description: 'For enterprises' },
 * ]).setRequired()
 * ```
 */
export class RadioButtonsGroup<N extends string = string> extends FormFieldComponent<N> {
  protected readonly type = 'RadioButtonsGroup' as const;

  private _initValue?: string | DynamicRef;

  /**
   * Create a radio buttons group component
   *
   * @param name - Field name
   * @param label - Display label
   * @param dataSource - Static options array or dynamic reference
   */
  constructor(
    name: N,
    private readonly label: string | DynamicRef,
    private readonly dataSource: DynamicRef | readonly RadioOptionSchema[],
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
   * Set initial selected value
   *
   * @param value - Option ID or dynamic reference
   * @returns this for chaining
   */
  setInitValue(value: string | DynamicRef): this {
    this._initValue = value;
    return this;
  }

  /**
   * Convert to JSON schema
   */
  toJSON(): RadioButtonsGroupSchema {
    const result: RadioButtonsGroupSchema = {
      type: this.type,
      name: this.name,
      label: this.label,
      'data-source': this.dataSource as DynamicRef | RadioOptionSchema[],
      ...this.formFieldBaseProps(),
    };

    if (this._initValue !== undefined) {
      result['init-value'] = this._initValue;
    }

    return result;
  }
}

/**
 * CheckboxGroup component for multiple selection
 *
 * @example
 * ```typescript
 * new CheckboxGroup('interests', 'Select Interests', [
 *   { id: 'tech', title: 'Technology' },
 *   { id: 'sports', title: 'Sports' },
 *   { id: 'music', title: 'Music' },
 *   { id: 'travel', title: 'Travel' },
 * ])
 *   .setMinSelectedItems(1)
 *   .setMaxSelectedItems(3)
 * ```
 */
export class CheckboxGroup<N extends string = string> extends FormFieldComponent<N> {
  protected readonly type = 'CheckboxGroup' as const;

  private _minSelectedItems?: number;

  private _maxSelectedItems?: number;

  private _initValue?: string[] | DynamicRef;

  /**
   * Create a checkbox group component
   *
   * @param name - Field name
   * @param label - Display label
   * @param dataSource - Static options array or dynamic reference
   */
  constructor(
    name: N,
    private readonly label: string | DynamicRef,
    private readonly dataSource: DynamicRef | readonly CheckboxOptionSchema[],
  ) {
    super(name);
  }

  /**
   * Get a reference to this field's value (array of selected IDs)
   */
  get ref(): FormRef<N> {
    return `\${form.${this.name}}` as FormRef<N>;
  }

  /**
   * Set minimum number of items that must be selected
   *
   * @param min - Minimum selected items
   * @returns this for chaining
   */
  setMinSelectedItems(min: number): this {
    this._minSelectedItems = min;
    return this;
  }

  /**
   * Set maximum number of items that can be selected
   *
   * @param max - Maximum selected items
   * @returns this for chaining
   */
  setMaxSelectedItems(max: number): this {
    this._maxSelectedItems = max;
    return this;
  }

  /**
   * Set initial selected values
   *
   * @param value - Array of option IDs or dynamic reference
   * @returns this for chaining
   */
  setInitValue(value: string[] | DynamicRef): this {
    this._initValue = value;
    return this;
  }

  /**
   * Convert to JSON schema
   */
  toJSON(): CheckboxGroupSchema {
    const result: CheckboxGroupSchema = {
      type: this.type,
      name: this.name,
      label: this.label,
      'data-source': this.dataSource as DynamicRef | CheckboxOptionSchema[],
      ...this.formFieldBaseProps(),
    };

    if (this._minSelectedItems !== undefined) {
      result['min-selected-items'] = this._minSelectedItems;
    }
    if (this._maxSelectedItems !== undefined) {
      result['max-selected-items'] = this._maxSelectedItems;
    }
    if (this._initValue !== undefined) {
      result['init-value'] = this._initValue;
    }

    return result;
  }
}
