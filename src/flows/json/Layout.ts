/* eslint-disable no-underscore-dangle */
/**
 * Layout class for WhatsApp Flow screens
 *
 * Currently, WhatsApp Flows only supports SingleColumnLayout.
 */
import type { LayoutSchema, LayoutType, ComponentSchema } from './types';

/**
 * Interface for components that can be added to a layout
 */
export interface LayoutComponent {
  toJSON(): ComponentSchema;
}

/**
 * Class representing the layout of a screen
 */
export class Layout {
  private readonly _type: LayoutType = 'SingleColumnLayout';

  private readonly _children: LayoutComponent[] = [];

  /**
   * Get the layout type
   */
  get type(): LayoutType {
    return this._type;
  }

  /**
   * Get the children (readonly)
   */
  get children(): readonly LayoutComponent[] {
    return this._children;
  }

  /**
   * Add a component to the layout
   *
   * @param component - Component to add
   * @returns this for chaining
   */
  addChild(component: LayoutComponent): this {
    this._children.push(component);
    return this;
  }

  /**
   * Add multiple components to the layout
   *
   * @param components - Components to add
   * @returns this for chaining
   */
  addChildren(...components: LayoutComponent[]): this {
    this._children.push(...components);
    return this;
  }

  /**
   * Convert to JSON schema object
   *
   * @returns LayoutSchema object
   */
  toJSON(): LayoutSchema {
    return {
      type: this._type,
      children: this._children.map((child) => child.toJSON()),
    };
  }
}
