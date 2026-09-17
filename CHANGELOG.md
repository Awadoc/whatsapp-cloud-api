# CHANGELOG

## 3.2.0

### Added
- **`status` events** — `bot.on('status', ...)` now fires for `sent` / `delivered` /
  `read` / `failed` receipts, carrying `recipient_user_id` (BSUID), `pricing`,
  `conversation` and `errors`. Previously status webhooks were dropped entirely.
- **`edit` and `revoke` events** — when a user edits or deletes a message.
- **`bot.sendReaction(to, messageId, emoji?)`** — send/remove an emoji reaction.
- **`bot.sendRequestContactInfo(to, body)`** — interactive "share your phone
  number" prompt (Meta 2026).
- **Webhook signature verification** — pass `appSecret` to `getExpressRoute` /
  `getNextAppRouteHandlers` / `getNextPagesApiHandler`; unsigned POSTs get 401.
  Standalone `verifyWebhookSignature()` exported.
- **`bot.templates`** — list / get / create / update / delete message templates
  and read the namespace (needs `createBot(..., { wabaId })`). `authTemplateComponents()`
  helper for OTP templates.
- **`bot.username`** — get / set / remove the business username, plus reserved
  suggestions (Meta 2026).
- **`bot.profile`** — read and update the WhatsApp business profile.
- **`bot.blockUsers`** — block / unblock / list, accepting phone numbers or BSUIDs.
- **`msg.identity`** / **`getRecipientIdentity()`** — normalized view of which
  identifier a webhook carried (`key`, `primary`, `phoneUnavailable`, `replyTarget`, …).
- **`parseWebhookPayload` / `publishWebhookEvents`** exported for custom servers.
- Full [BSUID migration guide](./docs/BSUID_GUIDE.md) and rewritten [API reference](./API.md).

### Fixed
- **Express handler returned HTTP 400 for status-only webhooks**, causing Meta to
  retry every delivery/read receipt indefinitely. Now returns 200. A non-WhatsApp
  body now returns 404 (was 400); a valid but empty payload returns 200.
- **`user_id_update` webhook parsing** used the wrong payload shape. Now reads
  Meta's `user_id_update[].user_id.{previous,current}` (old `old_user_id` /
  `new_user_id` still exposed as aliases).
- **`business_username_updates`** — the webhook field name was misspelled
  (`business_username_update`); both are now handled, and the singular event name
  is kept as a deprecated alias.
- **`system` webhook** now recognises `type: 'user_changed_user_id'` (BSUID
  regeneration after a phone-number change).
- Sending to a BSUID no longer includes an empty `to: ''` field in the request.
- `markAsRead` no longer sends a spurious `recipient_type` field and accepts
  `markAsRead(id)` / `markAsRead(id, true)` in addition to the legacy 3-arg form.
- All incoming messages in a single webhook are now dispatched (previously only
  the first).
- Webhook parsing is shared between the Express and Next.js integrations, so both
  behave identically.

### Changed
- `Message.from` and `Message.replyTarget` are now optional (`from` is absent for
  username users).

## 3.1.3

### Fixed

- Restored missing core type exports from the main entry point (`@awadoc/whatsapp-cloud-api`)

---

## 3.1.0

### Added

- **WhatsApp Flows Support**: New module `@awadoc/whatsapp-cloud-api/flows`
  - Flow management (`createFlowManager`) - create, update, publish, deprecate, delete
  - Type-safe Flow JSON builders (`FlowJSON`, `Screen`, `Layout`)
  - Display components (`TextHeading`, `TextSubheading`, `TextBody`, `Image`, `EmbeddedLink`)
  - Input components (`TextInput`, `TextArea`, `Dropdown`, `RadioButtonsGroup`, `CheckboxGroup`, `DatePicker`)
  - Action builders (`NavigateAction`, `DataExchangeAction`, `CompleteAction`, `OpenUrlAction`)
  - Encryption utilities for data exchange (`generateKeyPair`, `decryptRequest`, `encryptResponse`)
  - Express/Next.js endpoint handlers for flow data exchange
- **BSUID Support**: New `from_user_id` field on messages for WhatsApp's Business-Scoped User ID
  - Future-proof identity handling as WhatsApp transitions away from phone number-based identity
  - Automatic extraction from both message and contact data
- **Debug Logger**: Set `DEBUG_WHATSAPP_CLOUD_API=true` to log incoming webhooks and outgoing requests
- **Comprehensive Test Suite**: Added extensive unit tests for Flows module, crypto, and core functionality

### Changed

- Force IPv4 for Axios requests to improve connectivity reliability

---

## 3.0.0

### Added

- **Next.js Support**: New module `@awadoc/whatsapp-cloud-api/next`
  - `getNextAppRouteHandlers(phoneId, options)` - For Next.js 13+ App Router
  - `getNextPagesApiHandler(phoneId, options)` - For Next.js Pages Router
- **Separate Express module**: `@awadoc/whatsapp-cloud-api/express`
  - `getExpressRoute(phoneId, options)` - Express webhook handler

### Breaking Changes

- `getExpressRoute` removed from `Bot` interface - import from `/express` instead:
  ```typescript
  // Before (v2.x)
  app.use('/webhook', bot.getExpressRoute({ webhookVerifyToken }));
  
  // After (v3.0.0)
  import { getExpressRoute } from '@awadoc/whatsapp-cloud-api/express';
  app.use('/webhook', getExpressRoute(phoneId, { webhookVerifyToken }));
  ```
- Next.js is now an optional peer dependency

---

## 2.1.0

### Added

- New method: `uploadMedia` to upload media files to WhatsApp Cloud API
  - Supports automatic MIME type detection from file extensions
  - Accepts string paths, URL objects, or Buffer inputs
  - Optional MIME type parameter (auto-detected if not provided)
  - Returns media ID for use with send methods

### Changed

- Refactored `sendRequestHelper` to support multiple API endpoints (messages and media)
- Split axios client creation into separate functions: `getMessagesAxiosClient` and `getMediaAxiosClient`
- Moved type definitions to `sendRequestHelper.types.ts` for better organization
- Enhanced type safety with `ApiPathResponseMap` and `PathResponse` generic types

### Enhanced

- Improved internal architecture for handling different WhatsApp API endpoints
- Better separation of concerns between message sending and media uploading
- Type-safe response transformation based on API path

## 2.0.3

### Fixed

- Refactor Message interface to GenericMessage for improved type handling and update related type definitions

## 2.0.2

### Fixed

- Fix default type parameter for Message interface to ensure proper type inference

## 2.0.1

### Fixed

- Minor type definition fixes and improvements for better developer experience

## 2.0.0

### Added

- **BREAKING**: Comprehensive type safety with generic constraints for all message types
- **BREAKING**: Enhanced `FreeFormObjectMap` with complete type definitions for all WhatsApp message types
- New message type support: `reaction`, `order`, `system` messages
- Type-safe message event handlers with proper TypeScript inference
- Generic `'message'` event that receives all message types with proper type narrowing
- Specific event handlers with constrained types (e.g., `bot.on('text', ...)` receives only text messages)

### Changed

- **BREAKING**: `FreeFormObject` now uses strict typing instead of `any` for better type safety
- **BREAKING**: Message data structures now have specific interfaces instead of generic objects
- Enhanced PubSubEvents enum to be automatically derived from FreeFormObjectMap keys
- Improved TypeScript inference for message handling with conditional types

### Enhanced

- Complete type definitions for all media message types (image, document, audio, video, sticker)
- Full contact message structure with all WhatsApp contact fields
- Location message with proper coordinate and address types
- Interactive message types (button_reply, list_reply) with complete structures

### Developer Experience

- Better IDE autocompletion and type checking
- Compile-time type safety prevents runtime errors from incorrect data access
- Type narrowing in switch statements provides accurate intellisense
- Generic message handlers can safely handle all message types while maintaining type information

## 1.1.1

### Added

- Support Contextual replies

## 1.1.0

### Added

- New method: `sendCTAUrl` to send call-to-action links with buttons.
- New method: `markAsRead` with optional `typing_indicator` support to simulate bot typing behavior.
- Extended internal event system to handle more WhatsApp message types beyond basic text.

## 1.0.2

- Bug fix on reading from undefined

## 1.0.1

- Fix cases where message lenght is 0 throwing undefined
- updating npm github link

## [1.0.0] - 2025-04-13

### Changed

- Removed `bot.startExpressServer()` (breaking)
- Now users must setup express manually using `bot.getExpressRoute()`
- Upgraded base dependencies

## 0.3.1

Fix README.md 404 error

## 0.3.0

- Add option to unsubscribe from a bot listener

## 0.2.6

- Adds sender `name`. Change added by [@guskuma](https://github.com/guskuma).
  - PR [#28](https://github.com/tawn33y/whatsapp-cloud-api/pull/28)
  - PR [#25](https://github.com/tawn33y/whatsapp-cloud-api/pull/25)
- Capture message context always. Change added by [@guskuma](https://github.com/guskuma).
  - PR [#24](https://github.com/tawn33y/whatsapp-cloud-api/pull/24)

## 0.2.5

- Reduced bundle size by removing unnecessary files/folders from build.
- Repaired broken packages by fixing failing husky issues.
- Unpublished v0.2.2...v0.2.4 (broken packages).
- Add steps to do local package build & test it.

## 0.2.1

- Fix bugs; see [full list here](https://github.com/tawn33y/whatsapp-cloud-api/issues/14)
- Add new function:
  - sendText(to, text, [options])
- Export `Bot` and `Message` interfaces
- Add `Tutorial` & update documentation

## 0.2.0

Added functionality to receive messages:

- on(event, cb: (message) => void)
- startExpressServer([options])

## 0.1.0

Stable release. No changes.

## 0.1.0-beta

Beta release. No changes.

## 0.1.0-alpha.2

Utilizes a more cleaner API:

- createBot(fromPhoneNumberId, accessToken, version)
  - sendMessage(to, text, [options])
  - sendImage(to, urlOrObjectId, [options])
  - sendDocument(to, urlOrObjectId, [options])
  - sendAudio(to, urlOrObjectId)
  - sendVideo(to, urlOrObjectId, [options])
  - sendSticker(to, urlOrObjectId)
  - sendLocation(to, latitude, longitude, [options])
  - sendTemplate(to, name, languageCode, [components])
  - sendContacts(to, contacts)
  - sendReplyButtons(to, bodyText, buttons, [options])
  - sendList(to, buttonName, bodyText, sections, [options])

## 0.1.0-alpha

First version.
