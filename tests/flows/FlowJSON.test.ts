import * as fs from "fs";
import * as path from "path";
import { FlowJSON, Screen, Layout } from "../../src/flows/json";
import {
  TextHeading,
  TextBody,
  Footer,
  NavigateAction,
  CompleteAction,
} from "../../src/flows/json/components";

describe("FlowJSON", () => {
  describe("constructor", () => {
    it("should create a FlowJSON with default version 3.0", () => {
      const flow = new FlowJSON();
      const json = flow.toJSON();
      expect(json.version).toBe("3.0");
    });

    it("should create a FlowJSON with specified version", () => {
      const flow = new FlowJSON("5.0");
      const json = flow.toJSON();
      expect(json.version).toBe("5.0");
    });

    it("should support all valid versions", () => {
      const versions = ["3.0", "3.1", "4.0", "5.0"] as const;
      versions.forEach((version) => {
        const flow = new FlowJSON(version);
        expect(flow.toJSON().version).toBe(version);
      });
    });
  });

  describe("setDataApiVersion", () => {
    it("should set data_api_version", () => {
      const flow = new FlowJSON();
      flow.setDataApiVersion("3.0");
      expect(flow.toJSON().data_api_version).toBe("3.0");
    });

    it("should support chaining", () => {
      const flow = new FlowJSON();
      const result = flow.setDataApiVersion("4.0");
      expect(result).toBe(flow);
    });
  });

  describe("setRoutingModel", () => {
    it("should set routing_model", () => {
      const flow = new FlowJSON();
      const routingModel = {
        WELCOME: ["DETAILS"],
        DETAILS: ["CONFIRM"],
        CONFIRM: [],
      };
      flow.setRoutingModel(routingModel);
      expect(flow.toJSON().routing_model).toEqual(routingModel);
    });

    it("should support chaining", () => {
      const flow = new FlowJSON();
      const result = flow.setRoutingModel({ SCREEN1: [] });
      expect(result).toBe(flow);
    });
  });

  describe("addScreen", () => {
    it("should add a single screen", () => {
      const flow = new FlowJSON();
      const screen = new Screen("WELCOME").setTitle("Welcome");
      flow.addScreen(screen);

      const json = flow.toJSON();
      expect(json.screens).toHaveLength(1);
      expect(json.screens[0].id).toBe("WELCOME");
    });

    it("should support chaining", () => {
      const flow = new FlowJSON();
      const screen = new Screen("TEST");
      const result = flow.addScreen(screen);
      expect(result).toBe(flow);
    });
  });

  describe("addScreens", () => {
    it("should add multiple screens", () => {
      const flow = new FlowJSON();
      const screen1 = new Screen("SCREEN1").setTitle("Screen 1");
      const screen2 = new Screen("SCREEN2").setTitle("Screen 2");
      const screen3 = new Screen("SCREEN3").setTitle("Screen 3");

      flow.addScreens(screen1, screen2, screen3);

      const json = flow.toJSON();
      expect(json.screens).toHaveLength(3);
      expect(json.screens.map((s) => s.id)).toEqual([
        "SCREEN1",
        "SCREEN2",
        "SCREEN3",
      ]);
    });

    it("should support chaining", () => {
      const flow = new FlowJSON();
      const result = flow.addScreens(new Screen("S1"), new Screen("S2"));
      expect(result).toBe(flow);
    });
  });

  describe("toJSON", () => {
    it("should generate valid flow JSON structure", () => {
      const flow = new FlowJSON("3.0")
        .setDataApiVersion("3.0")
        .setRoutingModel({
          WELCOME: ["CONFIRM"],
          CONFIRM: [],
        })
        .addScreens(
          new Screen("WELCOME").setTitle("Welcome").setTerminal(false),
          new Screen("CONFIRM").setTitle("Confirm").setTerminal(true),
        );

      const json = flow.toJSON();

      expect(json).toEqual({
        version: "3.0",
        data_api_version: "3.0",
        routing_model: {
          WELCOME: ["CONFIRM"],
          CONFIRM: [],
        },
        screens: [
          expect.objectContaining({ id: "WELCOME", title: "Welcome" }),
          expect.objectContaining({
            id: "CONFIRM",
            title: "Confirm",
            terminal: true,
          }),
        ],
      });
    });

    it("should omit undefined properties", () => {
      const flow = new FlowJSON();
      flow.addScreen(new Screen("TEST"));

      const json = flow.toJSON();

      expect(json).not.toHaveProperty("data_api_version");
      expect(json).not.toHaveProperty("routing_model");
    });
  });

  describe("toString", () => {
    it("should convert to JSON string", () => {
      const flow = new FlowJSON();
      flow.addScreen(new Screen("TEST").setTitle("Test"));

      const str = flow.toString();
      const parsed = JSON.parse(str);

      expect(parsed.version).toBe("3.0");
      expect(parsed.screens[0].id).toBe("TEST");
    });

    it("should support custom indentation", () => {
      const flow = new FlowJSON();
      flow.addScreen(new Screen("TEST"));

      const str = flow.toString(2);
      expect(str).toContain("\n");
      expect(str).toContain("  ");
    });
  });

  describe("file operations", () => {
    const testFilePath = path.join(__dirname, "test-flow.json");

    afterEach(() => {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });

    describe("saveToFile", () => {
      it("should save flow to file", () => {
        const flow = new FlowJSON()
          .setDataApiVersion("3.0")
          .addScreen(new Screen("MAIN").setTitle("Main Screen"));

        flow.saveToFile(testFilePath);

        expect(fs.existsSync(testFilePath)).toBe(true);
        const content = fs.readFileSync(testFilePath, "utf-8");
        const parsed = JSON.parse(content);
        expect(parsed.screens[0].id).toBe("MAIN");
      });

      it("should save with custom indentation", () => {
        const flow = new FlowJSON().addScreen(new Screen("TEST"));
        flow.saveToFile(testFilePath, 4);

        const content = fs.readFileSync(testFilePath, "utf-8");
        expect(content).toContain("    ");
      });
    });

    describe("fromFile", () => {
      it("should load flow from file", () => {
        const originalFlow = new FlowJSON("4.0")
          .setDataApiVersion("3.0")
          .addScreen(new Screen("LOADED").setTitle("Loaded Screen"));
        originalFlow.saveToFile(testFilePath);

        const loadedFlow = FlowJSON.fromFile(testFilePath);
        const json = loadedFlow.toJSON();

        expect(json.version).toBe("4.0");
        expect(json.screens[0].id).toBe("LOADED");
      });

      it("should throw error for non-existent file", () => {
        expect(() => {
          FlowJSON.fromFile("/non/existent/path.json");
        }).toThrow();
      });
    });

    describe("fromJSON", () => {
      it("should create flow from JSON object", () => {
        const jsonObj = {
          version: "3.1" as const,
          screens: [
            {
              id: "FROM_OBJ",
              title: "From Object",
              layout: { type: "SingleColumnLayout" as const, children: [] },
            },
          ],
        };

        const flow = FlowJSON.fromJSON(jsonObj);
        const result = flow.toJSON();

        expect(result.version).toBe("3.1");
        expect(result.screens[0].id).toBe("FROM_OBJ");
      });

      it("should create flow from JSON string", () => {
        const jsonStr = JSON.stringify({
          version: "5.0",
          screens: [
            {
              id: "FROM_STR",
              title: "From String",
              layout: { type: "SingleColumnLayout", children: [] },
            },
          ],
        });

        const flow = FlowJSON.fromJSON(jsonStr);
        const result = flow.toJSON();

        expect(result.version).toBe("5.0");
        expect(result.screens[0].id).toBe("FROM_STR");
      });
    });
  });

  describe("complex flow building", () => {
    it("should build a complete multi-screen flow", () => {
      const welcomeScreen = new Screen("WELCOME")
        .setTitle("Welcome")
        .setData({
          greeting: { type: "string", __example__: "Hello!" },
        })
        .addComponents(
          new TextHeading("${data.greeting}"),
          new TextBody("Please continue to the next step."),
          new Footer("Continue", new NavigateAction("DETAILS")),
        );

      const detailsScreen = new Screen("DETAILS")
        .setTitle("Details")
        .setTerminal(true)
        .addComponents(
          new TextHeading("Confirmation"),
          new Footer("Complete", new CompleteAction({ completed: true })),
        );

      const flow = new FlowJSON("3.0")
        .setDataApiVersion("3.0")
        .setRoutingModel({
          WELCOME: ["DETAILS"],
          DETAILS: [],
        })
        .addScreens(welcomeScreen, detailsScreen);

      const json = flow.toJSON();

      expect(json.version).toBe("3.0");
      expect(json.data_api_version).toBe("3.0");
      expect(json.screens).toHaveLength(2);
      expect(json.routing_model).toEqual({
        WELCOME: ["DETAILS"],
        DETAILS: [],
      });

      // Verify WELCOME screen structure
      const welcome = json.screens[0];
      expect(welcome.id).toBe("WELCOME");
      expect(welcome.data).toEqual({
        greeting: { type: "string", __example__: "Hello!" },
      });

      // Verify DETAILS screen structure
      const details = json.screens[1];
      expect(details.id).toBe("DETAILS");
      expect(details.terminal).toBe(true);
    });
  });
});
