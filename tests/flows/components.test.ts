import {
  // Inputs
  TextInput,
  TextArea,
  // Selectors
  Dropdown,
  RadioButtonsGroup,
  CheckboxGroup,
  // Pickers
  DatePicker,
  // Display
  TextHeading,
  TextSubheading,
  TextBody,
  TextCaption,
  Image,
  // Navigation
  Footer,
  EmbeddedLink,
  // Containers
  Form,
  // Actions
  NavigateAction,
  DataExchangeAction,
  CompleteAction,
  OpenUrlAction,
} from "../../src/flows/json/components";

describe("Input Components", () => {
  describe("TextInput", () => {
    it("should create a text input with name and label", () => {
      const input = new TextInput("username", "Username");
      const json = input.toJSON();

      expect(json.type).toBe("TextInput");
      expect(json.name).toBe("username");
      expect(json.label).toBe("Username");
    });

    it("should set input-type", () => {
      const emailInput = new TextInput("email", "Email").setInputType("email");
      expect(emailInput.toJSON()["input-type"]).toBe("email");

      const passwordInput = new TextInput("pass", "Password").setInputType(
        "password",
      );
      expect(passwordInput.toJSON()["input-type"]).toBe("password");

      const phoneInput = new TextInput("phone", "Phone").setInputType("phone");
      expect(phoneInput.toJSON()["input-type"]).toBe("phone");

      const numberInput = new TextInput("age", "Age").setInputType("number");
      expect(numberInput.toJSON()["input-type"]).toBe("number");

      const passcodeInput = new TextInput("pin", "PIN").setInputType(
        "passcode",
      );
      expect(passcodeInput.toJSON()["input-type"]).toBe("passcode");
    });

    it("should set min and max characters", () => {
      const input = new TextInput("name", "Name")
        .setMinChars(2)
        .setMaxChars(50);

      const json = input.toJSON();
      expect(json["min-chars"]).toBe(2);
      expect(json["max-chars"]).toBe(50);
    });

    it("should set helper text", () => {
      const input = new TextInput("email", "Email").setHelperText(
        "Enter a valid email address",
      );

      expect(input.toJSON()["helper-text"]).toBe("Enter a valid email address");
    });

    it("should set initial value", () => {
      const input = new TextInput("name", "Name").setInitValue("John");
      expect(input.toJSON()["init-value"]).toBe("John");
    });

    it("should set initial value with dynamic reference", () => {
      const input = new TextInput("name", "Name").setInitValue(
        "${data.userName}",
      );
      expect(input.toJSON()["init-value"]).toBe("${data.userName}");
    });

    it("should set required", () => {
      const input = new TextInput("name", "Name").setRequired(true);
      expect(input.toJSON().required).toBe(true);
    });

    it("should set enabled", () => {
      const input = new TextInput("name", "Name").setEnabled(false);
      expect(input.toJSON().enabled).toBe(false);
    });

    it("should set enabled with dynamic reference", () => {
      const input = new TextInput("name", "Name").setEnabled("${data.canEdit}");
      expect(input.toJSON().enabled).toBe("${data.canEdit}");
    });

    it("should set visible", () => {
      const input = new TextInput("name", "Name").setVisible(false);
      expect(input.toJSON().visible).toBe(false);
    });

    it("should set visible with dynamic reference", () => {
      const input = new TextInput("name", "Name").setVisible(
        "${data.showField}",
      );
      expect(input.toJSON().visible).toBe("${data.showField}");
    });

    it("should set error message", () => {
      const input = new TextInput("email", "Email").setErrorMessage(
        "Please enter a valid email",
      );
      expect(input.toJSON()["error-message"]).toBe(
        "Please enter a valid email",
      );
    });

    it("should provide form reference", () => {
      const input = new TextInput("email", "Email");
      expect(input.ref).toBe("${form.email}");
    });

    it("should support method chaining", () => {
      const input = new TextInput("field", "Field")
        .setInputType("email")
        .setMinChars(5)
        .setMaxChars(100)
        .setHelperText("Help")
        .setRequired(true)
        .setEnabled(true)
        .setVisible(true)
        .setInitValue("test@test.com");

      const json = input.toJSON();
      expect(json.name).toBe("field");
      expect(json["input-type"]).toBe("email");
      expect(json["min-chars"]).toBe(5);
      expect(json["max-chars"]).toBe(100);
      expect(json["helper-text"]).toBe("Help");
      expect(json.required).toBe(true);
    });
  });

  describe("TextArea", () => {
    it("should create a text area with name and label", () => {
      const textarea = new TextArea("description", "Description");
      const json = textarea.toJSON();

      expect(json.type).toBe("TextArea");
      expect(json.name).toBe("description");
      expect(json.label).toBe("Description");
    });

    it("should set max length", () => {
      const textarea = new TextArea("notes", "Notes").setMaxLength(500);
      expect(textarea.toJSON()["max-length"]).toBe(500);
    });

    it("should set helper text", () => {
      const textarea = new TextArea("bio", "Bio").setHelperText(
        "Tell us about yourself",
      );
      expect(textarea.toJSON()["helper-text"]).toBe("Tell us about yourself");
    });

    it("should provide form reference", () => {
      const textarea = new TextArea("message", "Message");
      expect(textarea.ref).toBe("${form.message}");
    });
  });
});

describe("Selector Components", () => {
  describe("Dropdown", () => {
    it("should create dropdown with static data source", () => {
      const dropdown = new Dropdown("country", "Country", [
        { id: "us", title: "United States" },
        { id: "uk", title: "United Kingdom" },
        { id: "ca", title: "Canada" },
      ]);

      const json = dropdown.toJSON();
      expect(json.type).toBe("Dropdown");
      expect(json.name).toBe("country");
      expect(json.label).toBe("Country");
      expect(json["data-source"]).toHaveLength(3);
    });

    it("should create dropdown with dynamic data source", () => {
      const dropdown = new Dropdown("item", "Select Item", "${data.items}");

      const json = dropdown.toJSON();
      expect(json["data-source"]).toBe("${data.items}");
    });

    it("should support descriptions in options", () => {
      const dropdown = new Dropdown("plan", "Plan", [
        { id: "basic", title: "Basic", description: "$9.99/month" },
        { id: "pro", title: "Pro", description: "$19.99/month" },
      ]);

      const json = dropdown.toJSON();
      expect((json["data-source"] as any)[0].description).toBe("$9.99/month");
    });

    it("should support enabled property in options", () => {
      const dropdown = new Dropdown("option", "Option", [
        { id: "1", title: "Available", enabled: true },
        { id: "2", title: "Unavailable", enabled: false },
      ]);

      const json = dropdown.toJSON();
      expect((json["data-source"] as any)[1].enabled).toBe(false);
    });

    it("should set initial value", () => {
      const dropdown = new Dropdown("size", "Size", [
        { id: "s", title: "Small" },
        { id: "m", title: "Medium" },
        { id: "l", title: "Large" },
      ]).setInitValue("m");

      expect(dropdown.toJSON()["init-value"]).toBe("m");
    });

    it("should provide form reference", () => {
      const dropdown = new Dropdown("type", "Type", []);
      expect(dropdown.ref).toBe("${form.type}");
    });
  });

  describe("RadioButtonsGroup", () => {
    it("should create radio buttons group", () => {
      const radio = new RadioButtonsGroup("gender", "Gender", [
        { id: "male", title: "Male" },
        { id: "female", title: "Female" },
        { id: "other", title: "Other" },
      ]);

      const json = radio.toJSON();
      expect(json.type).toBe("RadioButtonsGroup");
      expect(json.name).toBe("gender");
      expect(json["data-source"]).toHaveLength(3);
    });

    it("should support dynamic data source", () => {
      const radio = new RadioButtonsGroup(
        "choice",
        "Choice",
        "${data.options}",
      );
      expect(radio.toJSON()["data-source"]).toBe("${data.options}");
    });

    it("should set initial value", () => {
      const radio = new RadioButtonsGroup("priority", "Priority", [
        { id: "low", title: "Low" },
        { id: "high", title: "High" },
      ]).setInitValue("low");

      expect(radio.toJSON()["init-value"]).toBe("low");
    });

    it("should provide form reference", () => {
      const radio = new RadioButtonsGroup("answer", "Answer", []);
      expect(radio.ref).toBe("${form.answer}");
    });
  });

  describe("CheckboxGroup", () => {
    it("should create checkbox group", () => {
      const checkbox = new CheckboxGroup("interests", "Interests", [
        { id: "sports", title: "Sports" },
        { id: "music", title: "Music" },
        { id: "reading", title: "Reading" },
      ]);

      const json = checkbox.toJSON();
      expect(json.type).toBe("CheckboxGroup");
      expect(json.name).toBe("interests");
      expect(json["data-source"]).toHaveLength(3);
    });

    it("should set min and max selected items", () => {
      const checkbox = new CheckboxGroup("toppings", "Toppings", [
        { id: "cheese", title: "Cheese" },
        { id: "pepperoni", title: "Pepperoni" },
        { id: "mushrooms", title: "Mushrooms" },
      ])
        .setMinSelectedItems(1)
        .setMaxSelectedItems(2);

      const json = checkbox.toJSON();
      expect(json["min-selected-items"]).toBe(1);
      expect(json["max-selected-items"]).toBe(2);
    });

    it("should support dynamic data source", () => {
      const checkbox = new CheckboxGroup(
        "features",
        "Features",
        "${data.availableFeatures}",
      );
      expect(checkbox.toJSON()["data-source"]).toBe(
        "${data.availableFeatures}",
      );
    });

    it("should provide form reference", () => {
      const checkbox = new CheckboxGroup("selected", "Selected", []);
      expect(checkbox.ref).toBe("${form.selected}");
    });
  });
});

describe("Picker Components", () => {
  describe("DatePicker", () => {
    it("should create date picker", () => {
      const datePicker = new DatePicker("birthdate", "Birth Date");

      const json = datePicker.toJSON();
      expect(json.type).toBe("DatePicker");
      expect(json.name).toBe("birthdate");
      expect(json.label).toBe("Birth Date");
    });

    it("should set min and max dates", () => {
      const datePicker = new DatePicker("appointment", "Appointment")
        .setMinDate("2024-01-01")
        .setMaxDate("2024-12-31");

      const json = datePicker.toJSON();
      expect(json["min-date"]).toBe("2024-01-01");
      expect(json["max-date"]).toBe("2024-12-31");
    });

    it("should set unavailable dates", () => {
      const datePicker = new DatePicker(
        "booking",
        "Booking Date",
      ).setUnavailableDates(["2024-12-25", "2024-01-01"]);

      expect(datePicker.toJSON()["unavailable-dates"]).toEqual([
        "2024-12-25",
        "2024-01-01",
      ]);
    });

    it("should set helper text", () => {
      const datePicker = new DatePicker("date", "Date").setHelperText(
        "Select a weekday",
      );

      expect(datePicker.toJSON()["helper-text"]).toBe("Select a weekday");
    });

    it("should set initial value", () => {
      const datePicker = new DatePicker("startDate", "Start Date").setInitValue(
        "2024-06-15",
      );

      expect(datePicker.toJSON()["init-value"]).toBe("2024-06-15");
    });

    it("should provide form reference", () => {
      const datePicker = new DatePicker("date", "Date");
      expect(datePicker.ref).toBe("${form.date}");
    });
  });
});

describe("Display Components", () => {
  describe("TextHeading", () => {
    it("should create text heading", () => {
      const heading = new TextHeading("Welcome");

      const json = heading.toJSON();
      expect(json.type).toBe("TextHeading");
      expect(json.text).toBe("Welcome");
    });

    it("should support dynamic text", () => {
      const heading = new TextHeading("${data.title}");
      expect(heading.toJSON().text).toBe("${data.title}");
    });

    it("should set visibility", () => {
      const heading = new TextHeading("Title").setVisible(false);
      expect(heading.toJSON().visible).toBe(false);
    });
  });

  describe("TextSubheading", () => {
    it("should create text subheading", () => {
      const subheading = new TextSubheading("Section Title");

      const json = subheading.toJSON();
      expect(json.type).toBe("TextSubheading");
      expect(json.text).toBe("Section Title");
    });
  });

  describe("TextBody", () => {
    it("should create text body", () => {
      const body = new TextBody("This is body text.");

      const json = body.toJSON();
      expect(json.type).toBe("TextBody");
      expect(json.text).toBe("This is body text.");
    });

    it("should set font weight", () => {
      const body = new TextBody("Bold text").setFontWeight("bold");
      expect(body.toJSON()["font-weight"]).toBe("bold");
    });

    it("should set strikethrough", () => {
      const body = new TextBody("Strikethrough").setStrikethrough(true);
      expect(body.toJSON().strikethrough).toBe(true);
    });
  });

  describe("TextCaption", () => {
    it("should create text caption", () => {
      const caption = new TextCaption("Small caption text");

      const json = caption.toJSON();
      expect(json.type).toBe("TextCaption");
      expect(json.text).toBe("Small caption text");
    });
  });

  describe("Image", () => {
    it("should create image with source", () => {
      const image = new Image("https://example.com/image.jpg");

      const json = image.toJSON();
      expect(json.type).toBe("Image");
      expect(json.src).toBe("https://example.com/image.jpg");
    });

    it("should support dynamic source", () => {
      const image = new Image("${data.imageUrl}");
      expect(image.toJSON().src).toBe("${data.imageUrl}");
    });

    it("should set dimensions", () => {
      const image = new Image("url").setWidth(300).setHeight(200);

      const json = image.toJSON();
      expect(json.width).toBe(300);
      expect(json.height).toBe(200);
    });

    it("should set scale type", () => {
      const image = new Image("url").setScaleType("cover");
      expect(image.toJSON()["scale-type"]).toBe("cover");

      const image2 = new Image("url").setScaleType("contain");
      expect(image2.toJSON()["scale-type"]).toBe("contain");
    });

    it("should set aspect ratio", () => {
      const image = new Image("url").setAspectRatio(1.5);
      expect(image.toJSON()["aspect-ratio"]).toBe(1.5);
    });

    it("should set alt text", () => {
      const image = new Image("url").setAltText("A beautiful landscape");
      expect(image.toJSON()["alt-text"]).toBe("A beautiful landscape");
    });
  });
});

describe("Navigation Components", () => {
  describe("Footer", () => {
    it("should create footer with label and navigate action", () => {
      const footer = new Footer("Continue", new NavigateAction("NEXT_SCREEN"));

      const json = footer.toJSON();
      expect(json.type).toBe("Footer");
      expect(json.label).toBe("Continue");
      expect(json["on-click-action"].name).toBe("navigate");
    });

    it("should create footer with complete action", () => {
      const footer = new Footer(
        "Submit",
        new CompleteAction({ success: true }),
      );

      const json = footer.toJSON();
      expect(json["on-click-action"].name).toBe("complete");
      expect((json["on-click-action"] as any).payload).toEqual({
        success: true,
      });
    });

    it("should create footer with data exchange action", () => {
      const footer = new Footer(
        "Validate",
        new DataExchangeAction({ step: "validate" }),
      );

      const json = footer.toJSON();
      expect(json["on-click-action"].name).toBe("data_exchange");
    });

    it("should set left caption", () => {
      const footer = new Footer(
        "Next",
        new NavigateAction("NEXT"),
      ).setLeftCaption("Step 1 of 3");

      expect(footer.toJSON()["left-caption"]).toBe("Step 1 of 3");
    });

    it("should set center caption", () => {
      const footer = new Footer(
        "Next",
        new NavigateAction("NEXT"),
      ).setCenterCaption("Almost done!");

      expect(footer.toJSON()["center-caption"]).toBe("Almost done!");
    });

    it("should set enabled state", () => {
      const footer = new Footer("Submit", new CompleteAction()).setEnabled(
        false,
      );

      expect(footer.toJSON().enabled).toBe(false);
    });

    it("should set enabled with dynamic reference", () => {
      const footer = new Footer("Submit", new CompleteAction()).setEnabled(
        "${form.isValid}",
      );

      expect(footer.toJSON().enabled).toBe("${form.isValid}");
    });
  });

  describe("EmbeddedLink", () => {
    it("should create embedded link with text and action", () => {
      const link = new EmbeddedLink(
        "Terms and Conditions",
        new OpenUrlAction("https://example.com/terms"),
      );

      const json = link.toJSON();
      expect(json.type).toBe("EmbeddedLink");
      expect(json.text).toBe("Terms and Conditions");
      expect(json["on-click-action"].name).toBe("open_url");
    });

    it("should create embedded link with navigate action", () => {
      const link = new EmbeddedLink(
        "Learn more",
        new NavigateAction("DETAILS"),
      );

      const json = link.toJSON();
      expect(json["on-click-action"].name).toBe("navigate");
      expect((json["on-click-action"] as any).next.name).toBe("DETAILS");
    });
  });
});

describe("Container Components", () => {
  describe("Form", () => {
    it("should create form container", () => {
      const form = new Form("userForm");

      const json = form.toJSON();
      expect(json.type).toBe("Form");
      expect(json.name).toBe("userForm");
    });

    it("should add child components", () => {
      const form = new Form("loginForm")
        .addChild(new TextInput("username", "Username"))
        .addChild(
          new TextInput("password", "Password").setInputType("password"),
        );

      const json = form.toJSON();
      expect(json.children).toHaveLength(2);
      expect(json.children[0].name).toBe("username");
      expect(json.children[1].name).toBe("password");
    });

    it("should add multiple children at once", () => {
      const form = new Form("form").addChildren(
        new TextInput("field1", "Field 1"),
        new TextInput("field2", "Field 2"),
        new TextInput("field3", "Field 3"),
      );

      expect(form.toJSON().children).toHaveLength(3);
    });

    it("should set initial values", () => {
      const form = new Form("profileForm").setInitValues({
        name: "John Doe",
        email: "john@example.com",
      });

      expect(form.toJSON()["init-values"]).toEqual({
        name: "John Doe",
        email: "john@example.com",
      });
    });

    it("should set error messages", () => {
      const form = new Form("form").setErrorMessages({
        email: "Invalid email format",
        password: "Password too short",
      });

      expect(form.toJSON()["error-messages"]).toEqual({
        email: "Invalid email format",
        password: "Password too short",
      });
    });
  });
});

describe("Action Classes", () => {
  describe("NavigateAction", () => {
    it("should create navigate action with screen name", () => {
      const action = new NavigateAction("DETAILS_SCREEN");

      const json = action.toJSON();
      expect(json.name).toBe("navigate");
      expect(json.next.type).toBe("screen");
      expect(json.next.name).toBe("DETAILS_SCREEN");
    });

    it("should create navigate action with payload", () => {
      const action = new NavigateAction("CONFIRM", {
        selectedItem: "${form.item}",
        quantity: 5,
      });

      const json = action.toJSON();
      expect(json.payload).toEqual({
        selectedItem: "${form.item}",
        quantity: 5,
      });
    });
  });

  describe("DataExchangeAction", () => {
    it("should create data exchange action", () => {
      const action = new DataExchangeAction();

      const json = action.toJSON();
      expect(json.name).toBe("data_exchange");
    });

    it("should create data exchange action with payload", () => {
      const action = new DataExchangeAction({
        action: "validate_email",
        email: "${form.email}",
      });

      const json = action.toJSON();
      expect(json.name).toBe("data_exchange");
      expect(json.payload).toEqual({
        action: "validate_email",
        email: "${form.email}",
      });
    });
  });

  describe("CompleteAction", () => {
    it("should create complete action", () => {
      const action = new CompleteAction();

      const json = action.toJSON();
      expect(json.name).toBe("complete");
    });

    it("should create complete action with payload", () => {
      const action = new CompleteAction({
        appointmentId: "${data.appointmentId}",
        confirmed: true,
      });

      const json = action.toJSON();
      expect(json.name).toBe("complete");
      expect(json.payload).toEqual({
        appointmentId: "${data.appointmentId}",
        confirmed: true,
      });
    });
  });

  describe("OpenUrlAction", () => {
    it("should create open URL action", () => {
      const action = new OpenUrlAction("https://example.com");

      const json = action.toJSON();
      expect(json.name).toBe("open_url");
      expect(json.url).toBe("https://example.com");
    });

    it("should support dynamic URLs", () => {
      const action = new OpenUrlAction("${data.termsUrl}");
      expect(action.toJSON().url).toBe("${data.termsUrl}");
    });
  });
});

describe("Component visibility", () => {
  it("should set visibility on all component types", () => {
    const components = [
      new TextInput("input", "Input"),
      new TextArea("textarea", "TextArea"),
      new Dropdown("dropdown", "Dropdown", []),
      new RadioButtonsGroup("radio", "Radio", []),
      new CheckboxGroup("checkbox", "Checkbox", []),
      new DatePicker("date", "Date"),
      new TextHeading("Heading"),
      new TextSubheading("Subheading"),
      new TextBody("Body"),
      new Image("url"),
    ];

    components.forEach((component) => {
      component.setVisible("${data.showComponent}");
      expect(component.toJSON().visible).toBe("${data.showComponent}");
    });
  });
});

describe("Complex form scenarios", () => {
  it("should build a complete registration form", () => {
    const form = new Form("registrationForm")
      .setInitValues({
        country: "us",
      })
      .addChildren(
        new TextInput("firstName", "First Name")
          .setRequired(true)
          .setMinChars(2)
          .setMaxChars(50),
        new TextInput("lastName", "Last Name").setRequired(true),
        new TextInput("email", "Email")
          .setInputType("email")
          .setRequired(true)
          .setHelperText("We will send confirmation to this email"),
        new TextInput("phone", "Phone Number").setInputType("phone"),
        new DatePicker("birthdate", "Birth Date")
          .setMaxDate("2010-01-01")
          .setHelperText("You must be at least 14 years old"),
        new Dropdown("country", "Country", [
          { id: "us", title: "United States" },
          { id: "uk", title: "United Kingdom" },
          { id: "ca", title: "Canada" },
        ]),
        new CheckboxGroup("interests", "Interests", [
          { id: "tech", title: "Technology" },
          { id: "sports", title: "Sports" },
          { id: "music", title: "Music" },
          { id: "travel", title: "Travel" },
        ])
          .setMinSelectedItems(1)
          .setMaxSelectedItems(3),
        new TextArea("bio", "Tell us about yourself")
          .setMaxLength(500)
          .setHelperText("Optional, max 500 characters"),
      );

    const json = form.toJSON();

    expect(json.type).toBe("Form");
    expect(json.name).toBe("registrationForm");
    expect(json.children).toHaveLength(8);
    expect(json["init-values"]).toEqual({ country: "us" });

    // Verify specific field properties
    const emailField = json.children.find((c: any) => c.name === "email");
    expect(emailField?.["input-type"]).toBe("email");
    expect((emailField as any)?.required).toBe(true);

    const interestsField = json.children.find(
      (c: any) => c.name === "interests",
    );
    expect(interestsField?.["min-selected-items"]).toBe(1);
    expect(interestsField?.["max-selected-items"]).toBe(3);
  });
});
