/* eslint-disable no-underscore-dangle */
/**
 * Picker components for WhatsApp Flows
 */
import type {
  DatePickerSchema,
  DynamicRef,
  FormRef,
} from '../types';
import { FormFieldComponent } from './base';

/**
 * DatePicker component for date selection
 *
 * @example
 * ```typescript
 * // Basic date picker
 * new DatePicker('appointment_date', 'Select Date')
 *   .setRequired()
 *
 * // With date constraints
 * new DatePicker('booking_date', 'Select Booking Date')
 *   .setMinDate('2024-01-01')
 *   .setMaxDate('2024-12-31')
 *   .setUnavailableDates(['2024-12-25', '2024-12-26'])
 *   .setHelperText('Select an available date')
 *
 * // With dynamic constraints
 * new DatePicker('date', 'Select Date')
 *   .setMinDate('${data.min_available_date}')
 *   .setUnavailableDates('${data.blocked_dates}')
 * ```
 */
export class DatePicker<N extends string = string> extends FormFieldComponent<N> {
  protected readonly type = 'DatePicker' as const;

  private _minDate?: string | DynamicRef;

  private _maxDate?: string | DynamicRef;

  private _unavailableDates?: string[] | DynamicRef;

  private _helperText?: string | DynamicRef;

  private _initValue?: string | DynamicRef;

  /**
   * Create a date picker component
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
   * Get a reference to this field's value (date string in YYYY-MM-DD format)
   */
  get ref(): FormRef<N> {
    return `\${form.${this.name}}` as FormRef<N>;
  }

  /**
   * Set minimum selectable date
   *
   * @param date - Date string (YYYY-MM-DD) or dynamic reference
   * @returns this for chaining
   */
  setMinDate(date: string | DynamicRef): this {
    this._minDate = date;
    return this;
  }

  /**
   * Set maximum selectable date
   *
   * @param date - Date string (YYYY-MM-DD) or dynamic reference
   * @returns this for chaining
   */
  setMaxDate(date: string | DynamicRef): this {
    this._maxDate = date;
    return this;
  }

  /**
   * Set dates that cannot be selected
   *
   * @param dates - Array of date strings or dynamic reference
   * @returns this for chaining
   */
  setUnavailableDates(dates: string[] | DynamicRef): this {
    this._unavailableDates = dates;
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
   * @param value - Date string (YYYY-MM-DD) or dynamic reference
   * @returns this for chaining
   */
  setInitValue(value: string | DynamicRef): this {
    this._initValue = value;
    return this;
  }

  /**
   * Convert to JSON schema
   */
  toJSON(): DatePickerSchema {
    const result: DatePickerSchema = {
      type: this.type,
      name: this.name,
      label: this.label,
      ...this.formFieldBaseProps(),
    };

    if (this._minDate !== undefined) {
      result['min-date'] = this._minDate;
    }
    if (this._maxDate !== undefined) {
      result['max-date'] = this._maxDate;
    }
    if (this._unavailableDates !== undefined) {
      result['unavailable-dates'] = this._unavailableDates;
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
