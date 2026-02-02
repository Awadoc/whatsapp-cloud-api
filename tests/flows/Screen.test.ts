import { Screen, Layout } from '../../src/flows/json';
import {
  TextHeading,
  TextBody,
  Footer,
  NavigateAction,
} from '../../src/flows/json/components';

describe('Screen', () => {
  describe('constructor', () => {
    it('should create a screen with the given id', () => {
      const screen = new Screen('MY_SCREEN');
      const json = screen.toJSON();
      expect(json.id).toBe('MY_SCREEN');
    });

    it('should have an internal layout', () => {
      const screen = new Screen('TEST');
      expect(screen.layout).toBeInstanceOf(Layout);
    });
  });

  describe('setTitle', () => {
    it('should set the title', () => {
      const screen = new Screen('TEST').setTitle('My Title');
      expect(screen.toJSON().title).toBe('My Title');
    });

    it('should support dynamic references', () => {
      // eslint-disable-next-line no-template-curly-in-string
      const screen = new Screen('TEST').setTitle('${data.title}');
      // eslint-disable-next-line no-template-curly-in-string
      expect(screen.toJSON().title).toBe('${data.title}');
    });

    it('should support chaining', () => {
      const screen = new Screen('TEST');
      const result = screen.setTitle('Title');
      expect(result).toBe(screen);
    });
  });

  describe('setTerminal', () => {
    it('should set terminal to true', () => {
      const screen = new Screen('TEST').setTerminal(true);
      expect(screen.toJSON().terminal).toBe(true);
    });

    it('should set terminal to false explicitly', () => {
      const screen = new Screen('TEST').setTerminal(false);
      // false may be omitted in output since it's the default
      const json = screen.toJSON();
      expect(json.terminal === false || json.terminal === undefined).toBe(true);
    });

    it('should default to true when called without argument', () => {
      const screen = new Screen('TEST').setTerminal();
      expect(screen.toJSON().terminal).toBe(true);
    });

    it('should support chaining', () => {
      const screen = new Screen('TEST');
      const result = screen.setTerminal(true);
      expect(result).toBe(screen);
    });
  });

  describe('setRefreshOnBack', () => {
    it('should set refresh_on_back', () => {
      const screen = new Screen('TEST').setRefreshOnBack(true);
      expect(screen.toJSON().refresh_on_back).toBe(true);
    });

    it('should default to true when called without argument', () => {
      const screen = new Screen('TEST').setRefreshOnBack();
      expect(screen.toJSON().refresh_on_back).toBe(true);
    });

    it('should support chaining', () => {
      const screen = new Screen('TEST');
      const result = screen.setRefreshOnBack(true);
      expect(result).toBe(screen);
    });
  });

  describe('setData', () => {
    it('should set data declarations', () => {
      const screen = new Screen('TEST').setData({
        name: { type: 'string', __example__: 'John' },
        age: { type: 'number', __example__: 25 },
        active: { type: 'boolean', __example__: true },
      });

      const json = screen.toJSON();
      expect(json.data).toEqual({
        name: { type: 'string', __example__: 'John' },
        age: { type: 'number', __example__: 25 },
        active: { type: 'boolean', __example__: true },
      });
    });

    it('should support object and array types', () => {
      const screen = new Screen('TEST').setData({
        user: { type: 'object', __example__: { id: 1 } },
        items: { type: 'array', __example__: ['a', 'b'] },
      });

      const json = screen.toJSON();
      expect(json.data?.user.type).toBe('object');
      expect(json.data?.items.type).toBe('array');
    });

    it('should support chaining', () => {
      const screen = new Screen('TEST');
      const result = screen.setData({ key: { type: 'string' } });
      expect(result).toBe(screen);
    });
  });

  describe('addData', () => {
    it('should add a single data declaration', () => {
      const screen = new Screen('TEST').addData('name', {
        type: 'string',
        __example__: 'Test',
      });

      expect(screen.toJSON().data?.name).toEqual({
        type: 'string',
        __example__: 'Test',
      });
    });

    it('should add multiple data declarations', () => {
      const screen = new Screen('TEST')
        .addData('first', { type: 'string' })
        .addData('second', { type: 'number' });

      const json = screen.toJSON();
      expect(json.data?.first).toEqual({ type: 'string' });
      expect(json.data?.second).toEqual({ type: 'number' });
    });

    it('should support chaining', () => {
      const screen = new Screen('TEST');
      const result = screen.addData('key', { type: 'string' });
      expect(result).toBe(screen);
    });
  });

  describe('addComponent', () => {
    it('should add a component to the internal layout', () => {
      const screen = new Screen('TEST').addComponent(new TextHeading('Hello'));

      const json = screen.toJSON();
      expect(json.layout).toBeDefined();
      expect(json.layout.type).toBe('SingleColumnLayout');
      expect(json.layout.children).toHaveLength(1);
      expect(json.layout.children[0].type).toBe('TextHeading');
    });

    it('should support chaining', () => {
      const screen = new Screen('TEST');
      const result = screen.addComponent(new TextHeading('Test'));
      expect(result).toBe(screen);
    });

    it('should add multiple components via chaining', () => {
      const screen = new Screen('TEST')
        .addComponent(new TextHeading('First'))
        .addComponent(new TextBody('Second'))
        .addComponent(new TextBody('Third'));

      const json = screen.toJSON();
      expect(json.layout.children).toHaveLength(3);
    });
  });

  describe('addComponents', () => {
    it('should add multiple components at once', () => {
      const screen = new Screen('TEST').addComponents(
        new TextHeading('Heading'),
        new TextBody('Body 1'),
        new TextBody('Body 2'),
        new Footer('Submit', new NavigateAction('NEXT')),
      );

      const json = screen.toJSON();
      expect(json.layout.children).toHaveLength(4);
      expect(json.layout.children[0].type).toBe('TextHeading');
      expect(json.layout.children[1].type).toBe('TextBody');
      expect(json.layout.children[2].type).toBe('TextBody');
      expect(json.layout.children[3].type).toBe('Footer');
    });

    it('should support chaining', () => {
      const screen = new Screen('TEST');
      const result = screen.addComponents(new TextHeading('Test'));
      expect(result).toBe(screen);
    });
  });

  describe('toJSON', () => {
    it('should generate complete screen JSON', () => {
      const screen = new Screen('COMPLETE_SCREEN')
        .setTitle('Complete Screen')
        .setTerminal(true)
        .setRefreshOnBack(true)
        .setData({
          message: { type: 'string', __example__: 'Hello' },
        })
        .addComponents(
          // eslint-disable-next-line no-template-curly-in-string
          new TextHeading('${data.message}'),
          new Footer('Next', new NavigateAction('NEXT_SCREEN')),
        );

      const json = screen.toJSON();

      expect(json.id).toBe('COMPLETE_SCREEN');
      expect(json.title).toBe('Complete Screen');
      expect(json.terminal).toBe(true);
      expect(json.refresh_on_back).toBe(true);
      expect(json.data).toEqual({
        message: { type: 'string', __example__: 'Hello' },
      });
      expect(json.layout.type).toBe('SingleColumnLayout');
      expect(json.layout.children).toHaveLength(2);
    });

    it('should omit undefined optional properties', () => {
      const screen = new Screen('MINIMAL').setTitle('Minimal');

      const json = screen.toJSON();

      expect(json.id).toBe('MINIMAL');
      expect(json.title).toBe('Minimal');
      expect(json).not.toHaveProperty('terminal');
      expect(json).not.toHaveProperty('refresh_on_back');
      expect(json).not.toHaveProperty('data');
    });
  });
});

describe('Layout', () => {
  describe('constructor', () => {
    it('should create a SingleColumnLayout by default', () => {
      const layout = new Layout();
      const json = layout.toJSON();
      expect(json.type).toBe('SingleColumnLayout');
    });
  });

  describe('addChild', () => {
    it('should add a single component', () => {
      const layout = new Layout();
      layout.addChild(new TextHeading('Test'));

      const json = layout.toJSON();
      expect(json.children).toHaveLength(1);
      expect(json.children[0].type).toBe('TextHeading');
    });

    it('should support chaining', () => {
      const layout = new Layout();
      const result = layout.addChild(new TextHeading('Test'));
      expect(result).toBe(layout);
    });

    it('should add multiple children via chaining', () => {
      const layout = new Layout()
        .addChild(new TextHeading('First'))
        .addChild(new TextBody('Second'))
        .addChild(new TextBody('Third'));

      const json = layout.toJSON();
      expect(json.children).toHaveLength(3);
    });
  });

  describe('addChildren', () => {
    it('should add multiple components at once', () => {
      const layout = new Layout().addChildren(
        new TextHeading('Heading'),
        new TextBody('Body 1'),
        new TextBody('Body 2'),
        new Footer('Submit', new NavigateAction('NEXT')),
      );

      const json = layout.toJSON();
      expect(json.children).toHaveLength(4);
      expect(json.children[0].type).toBe('TextHeading');
      expect(json.children[1].type).toBe('TextBody');
      expect(json.children[2].type).toBe('TextBody');
      expect(json.children[3].type).toBe('Footer');
    });

    it('should support chaining', () => {
      const layout = new Layout();
      const result = layout.addChildren(new TextHeading('Test'));
      expect(result).toBe(layout);
    });
  });

  describe('toJSON', () => {
    it('should generate valid layout JSON', () => {
      const layout = new Layout()
        .addChild(new TextHeading('Welcome'))
        .addChild(new TextBody('Please fill out the form below.'));

      const json = layout.toJSON();

      expect(json).toEqual({
        type: 'SingleColumnLayout',
        children: [
          expect.objectContaining({ type: 'TextHeading', text: 'Welcome' }),
          expect.objectContaining({
            type: 'TextBody',
            text: 'Please fill out the form below.',
          }),
        ],
      });
    });

    it('should generate empty children array when no components added', () => {
      const layout = new Layout();
      const json = layout.toJSON();

      expect(json.type).toBe('SingleColumnLayout');
      expect(json.children).toEqual([]);
    });
  });
});
