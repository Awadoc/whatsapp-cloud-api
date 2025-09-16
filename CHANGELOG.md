# CHANGELOG

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
