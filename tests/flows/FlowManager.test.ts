import * as fs from "fs";
import * as path from "path";
import { createBot } from "../../src";
import { createFlowManager, FlowJSON, Screen } from "../../src/flows";
import {
  TextHeading,
  TextBody,
  Footer,
  CompleteAction,
} from "../../src/flows/json/components";

// Load environment variables
const wabaId = process.env.WABA_ID;
const accessToken = process.env.ACCESS_TOKEN;
const fromPhoneNumberId = process.env.FROM_PHONE_NUMBER_ID;
const to = process.env.TO;
const version = process.env.VERSION;

// Skip tests if environment variables are not set
const shouldRunIntegrationTests =
  wabaId && accessToken && fromPhoneNumberId && to;

const describeIf = shouldRunIntegrationTests ? describe : describe.skip;

/**
 * Helper to log operation details, timing, and errors
 */
async function logOperation<T>(
  name: string,
  operation: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  console.log(`\n[START] ${name}`);
  console.log(`[TIME] ${new Date().toISOString()}`);

  try {
    const result = await operation();
    const duration = Date.now() - start;
    console.log(`[SUCCESS] ${name}`);
    console.log(`[DURATION] ${duration}ms`);
    console.log(
      `[RESULT] ${JSON.stringify(
        result,
        (key, value) =>
          key === "data" && Array.isArray(value)
            ? `[Array(${value.length})]`
            : value,
        2,
      )}`,
    );
    return result;
  } catch (error: any) {
    const duration = Date.now() - start;
    console.error(`[ERROR] ${name}`);
    console.error(`[DURATION] ${duration}ms`);

    // Log helpful details based on error type
    console.error(`[ERROR TYPE] ${typeof error}`);
    console.error(`[RAW ERROR]`, error);
    if (error.response?.data) {
      console.error(
        `[API ERROR DATA] ${JSON.stringify(error.response.data, null, 2)}`,
      );
    } else if (error instanceof Error) {
      console.error(`[ERROR MESSAGE] ${error.message}`);
      console.error(`[ERROR STACK] ${error.stack}`);
    } else {
      console.error(`[ERROR OBJECT] ${JSON.stringify(error, null, 2)}`);
    }

    throw error;
  }
}

describeIf("FlowManager Lifecycle Integration Test", () => {
  const flowManager = createFlowManager(wabaId!, accessToken!, {
    version: version as any,
  });
  const bot = createBot(fromPhoneNumberId!, accessToken!, { version });

  // Store flow ID to use across steps
  let flowId: string;

  // Cleanup in case of failure
  afterAll(async () => {
    if (flowId) {
      console.log("\n--- CLEANUP ---");
      try {
        await flowManager.delete(flowId);
        console.log(`Cleanup: Deleted flow ${flowId}`);
      } catch (e: any) {
        console.log(
          `Cleanup: Could not delete flow (it might be published, deprecated, or already deleted). Error: ${e.message}`,
        );
      }
    }
  }, 30000);

  it("should execute the full flow lifecycle: Create -> Send -> Update -> Send -> Publish -> Send -> Deprecate -> Delete", async () => {
    console.log("Starting Flow Lifecycle Sequence...");

    // -------------------------------------------------------------------------
    // 1. Create Flow as Draft
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 1: CREATE FLOW (DRAFT)");
    const createResult = await logOperation("Create Flow", async () => {
      const randomSuffix = Math.floor(Math.random() * 10000).toString();
      return flowManager.create({
        name: `Flow_Test_${randomSuffix}`,
        categories: ["OTHER"],
      });
    });
    flowId = createResult.id;
    expect(flowId).toBeDefined();

    // -------------------------------------------------------------------------
    // Setup Initial Flow Content (required before sending)
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 1.1: UPLOAD INITIAL JSON");
    const initialJson = new FlowJSON("6.0").addScreen(
      new Screen("SCREEN_ONE")
        .setTitle("Draft v1")
        .setTerminal(true)
        .addComponents(
          new TextHeading("This is Draft Version 1"),
          new TextBody("If you see this, the initial draft creation works."),
          new Footer("Done", new CompleteAction()),
        ),
    );

    const update1Result = await logOperation(
      "Upload Initial JSON",
      async () => {
        return flowManager.updateJson(flowId, initialJson);
      },
    );

    // Check for validation errors and throw if found, to separate API success from logic failure
    if (
      update1Result.validation_errors &&
      update1Result.validation_errors.length > 0
    ) {
      throw new Error(
        `Flow JSON Validation Failed: ${JSON.stringify(update1Result.validation_errors)}`,
      );
    }

    // -------------------------------------------------------------------------
    // 2. Send Flow (Draft)
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 2: SEND FLOW (DRAFT)");
    await logOperation("Send Draft Flow v1", async () => {
      return bot.sendFlow(to!, flowId, "Open Draft v1", {
        body: "Testing Lifecycle: Draft Flow v1",
        mode: "draft",
        flowAction: "navigate",
        flowActionPayload: { screen: "SCREEN_ONE" },
      });
    });

    // -------------------------------------------------------------------------
    // 3. Update Flow with New Screen
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 3: UPDATE FLOW (NEW SCREEN)");
    const updatedJson = new FlowJSON("6.0").addScreen(
      new Screen("SCREEN_ONE")
        .setTitle("Draft v2 (Updated)")
        .setTerminal(true)
        .addComponents(
          new TextHeading("This is Draft Version 2"),
          new TextBody("The flow has been updated with new content."),
          new Footer("Finish", new CompleteAction()),
        ),
    );

    const update2Result = await logOperation("Update Flow JSON", async () => {
      return flowManager.updateJson(flowId, updatedJson);
    });

    if (
      update2Result.validation_errors &&
      update2Result.validation_errors.length > 0
    ) {
      throw new Error(
        `Flow JSON Validation Failed: ${JSON.stringify(update2Result.validation_errors)}`,
      );
    }

    // -------------------------------------------------------------------------
    // 4. Send Flow (Draft - Updated)
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 4: SEND FLOW (UPDATED DRAFT)");
    await logOperation("Send Draft Flow v2", async () => {
      return bot.sendFlow(to!, flowId, "Open Draft v2", {
        body: "Testing Lifecycle: Draft Flow v2 (Updated)",
        mode: "draft",
        flowAction: "navigate",
        flowActionPayload: { screen: "SCREEN_ONE" },
      });
    });

    // -------------------------------------------------------------------------
    // 5. Publish Flow
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 5: PUBLISH FLOW");
    await logOperation("Publish Flow", async () => {
      return flowManager.publish(flowId);
    });

    // -------------------------------------------------------------------------
    // 6. Send Flow (Published)
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 6: SEND FLOW (PUBLISHED)");
    // Small delay to ensure propagation if necessary, though usually instant
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await logOperation("Send Published Flow", async () => {
      return bot.sendFlow(to!, flowId, "Open Published Flow", {
        body: "Testing Lifecycle: Published Flow",
        mode: "published",
        flowAction: "navigate",
        flowActionPayload: { screen: "SCREEN_ONE" },
      });
    });

    // -------------------------------------------------------------------------
    // 7. Deprecate Flow
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 7: DEPRECATE FLOW");
    await logOperation("Deprecate Flow", async () => {
      return flowManager.deprecate(flowId);
    });

    // -------------------------------------------------------------------------
    // 8. Delete Flow
    // -------------------------------------------------------------------------
    console.log("\n>>> STEP 8: DELETE FLOW");
    try {
      await logOperation("Delete Flow", async () => {
        return flowManager.delete(flowId);
      });
    } catch (error) {
      console.log(
        "NOTE: Deletion failed. This is often expected for flows that were published/deprecated, as WhatsApp may not allow immediate deletion.",
      );
      // We don't fail the test here if it's just a permission issue with deleting published flows
      // But we do want to see the error log above.
    }
  }, 180000); // 3-minute timeout for the whole sequence
});
