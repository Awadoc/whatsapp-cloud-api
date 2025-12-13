# API Reference

## List

- [createBot(fromPhoneNumberId, accessToken, version)](#create_bot)
  - [sendText(to, text, [options])](#send_text)
  - [sendMessage(to, text, [options])](#send_message)
  - [sendImage(to, urlOrObjectId, [options])](#send_image)
  - [sendDocument(to, urlOrObjectId, [options])](#send_document)
  - [sendAudio(to, urlOrObjectId, [options])](#send_audio)
  - [sendVideo(to, urlOrObjectId, [options])](#send_video)
  - [sendSticker(to, urlOrObjectId, [options])](#send_sticker)
  - [sendLocation(to, latitude, longitude, [options])](#send_location)
  - [sendTemplate(to, name, languageCode, [components], [options])](#send_template)
  - [sendContacts(to, contacts, [options])](#send_contacts)
  - [sendReplyButtons(to, bodyText, buttons, [options])](#send_reply_buttons)
  - [sendList(to, buttonName, bodyText, sections, [options])](#send_list)
  - [sendCTAUrl(to, bodyText, display_text, url, [options])](#send_cta_url)
  - [markAsRead(message_id, status, typing_indicator)](#mark_as_read)
  - [on(event, cb: (message) => void)](#on_event)

### Separate Modules (v3.0.0+)

- [@awadoc/whatsapp-cloud-api/express](#express_module)
  - [getExpressRoute(fromPhoneNumberId, [options])](#get_express_route)
- [@awadoc/whatsapp-cloud-api/next](#next_module)
  - [getNextAppRouteHandlers(fromPhoneNumberId, [options])](#get_next_app_route_handlers)
  - [getNextPagesApiHandler(fromPhoneNumberId, [options])](#get_next_pages_api_handler)

## Details

<a name="create_bot"></a>

### createBot(fromPhoneNumberId, accessToken, version)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| fromPhoneNumberId | `String` | | WhatsApp ID of business phone number. |
| accessToken | `String` | | Temporary or Permanent access token. |
| version | `String` | | API version (optional). |

<a name="send_text"></a>

### sendText(to, text, [options])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| to | `String` | | WhatsApp ID or phone number for the person you want to send a message to. |
| text | `String` | | The text of the text message. |
| [options] | `Object` | | |
| [options.preview_url] | `Boolean` | | By default, WhatsApp recognizes URLs and makes them clickable, but you can also include a preview box with more information about the link. Set this field to true if you want to include a URL preview box. |
| [options.context] | `Object` | | Context for the message. |
| [options.context.message_id] | `String` | | The message ID to send context with (e.g., for replying to a specific message). |

<a name="send_message"></a>

### sendMessage(to, text, [options])

Same as `sendText` above.

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| to | `String` | | WhatsApp ID or phone number for the person you want to send a message to. |
| text | `String` | | The text of the text message. |
| [options] | `Object` | | |
| [options.preview_url] | `Boolean` | | By default, WhatsApp recognizes URLs and makes them clickable, but you can also include a preview box with more information about the link. Set this field to true if you want to include a URL preview box. |
| [options.context] | `Object` | | Context for the message. |
| [options.context.message_id] | `String` | | The message ID to send context with (e.g., for replying to a specific message). |

<a name="send_image"></a>

### sendImage(to, urlOrObjectId, [options])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| to | `String` | | WhatsApp ID or phone number for the person you want to send a message to. |
| urlOrObjectId | `String` | | Either one of the following: <br /> - **URL Link**: use only with HTTP/HTTPS URLs <br /> - **Media Object ID**. See [Get Media ID](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media#get-media-id) for information on how to get the ID of your media object. |
| [options] | `Object` | | |
| [options.caption] | `String` | | Describes the image. |
| [options.context] | `Object` | | Context for the message. |
| [options.context.message_id] | `String` | | The message ID to send context with (e.g., for replying to a specific message). |

<a name="send_document"></a>

### sendDocument(to, urlOrObjectId, [options])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| to | `String` | | WhatsApp ID or phone number for the person you want to send a message to. |
| urlOrObjectId | `String` | | Either one of the following: <br /> - **URL Link**: use only with HTTP/HTTPS URLs <br /> - **Media Object ID**. See [Get Media ID](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media#get-media-id) for information on how to get the ID of your media object. |
| [options] | `Object` | | |
| [options.caption] | `String` | | Describes the document. |
| [options.filename] | `String` | | Describes the filename for the specific document. |
| [options.context] | `Object` | | Context for the message. |
| [options.context.message_id] | `String` | | The message ID to send context with (e.g., for replying to a specific message). |

<a name="send_audio"></a>

### sendAudio(to, urlOrObjectId, [options])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| to | `String` | | WhatsApp ID or phone number for the person you want to send a message to. |
| urlOrObjectId | `String` | | Either one of the following: <br /> - **URL Link**: use only with HTTP/HTTPS URLs <br /> - **Media Object ID**. See [Get Media ID](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media#get-media-id) for information on how to get the ID of your media object. |
| [options] | `Object` | | |
| [options.context] | `Object` | | Context for the message. |
| [options.context.message_id] | `String` | | The message ID to send context with (e.g., for replying to a specific message). |

<a name="send_video"></a>

### sendVideo(to, urlOrObjectId, [options])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| to | `String` | | WhatsApp ID or phone number for the person you want to send a message to. |
| urlOrObjectId | `String` | | Either one of the following: <br /> - **URL Link**: use only with HTTP/HTTPS URLs <br /> - **Media Object ID**. See [Get Media ID](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media#get-media-id) for information on how to get the ID of your media object. |
| [options] | `Object` | | |
| [options.caption] | `String` | | Describes the video. |
| [options.context] | `Object` | | Context for the message. |
| [options.context.message_id] | `String` | | The message ID to send context with (e.g., for replying to a specific message). |

<a name="send_sticker"></a>

### sendSticker(to, urlOrObjectId, [options])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| to | `String` | | WhatsApp ID or phone number for the person you want to send a message to. |
| urlOrObjectId | `String` | | Either one of the following: <br /> - **URL Link**: use only with HTTP/HTTPS URLs <br /> - **Media Object ID**. See [Get Media ID](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media#get-media-id) for information on how to get the ID of your media object. |
| [options] | `Object` | | |
| [options.context] | `Object` | | Context for the message. |
| [options.context.message_id] | `String` | | The message ID to send context with (e.g., for replying to a specific message). |

<a name="send_location"></a>

### sendLocation(to, latitude, longitude, [options])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| to | `String` | | WhatsApp ID or phone number for the person you want to send a message to. |
| latitude | `Number` | | Latitude of the location. |
| longitude | `Number` | | Longitude of the location. |
| [options] | `Object` | | |
| [options.name] | `String` | | Name of location. |
| [options.address] | `String` | | Address of the location. Only displayed if name is present. |
| [options.context] | `Object` | | Context for the message. |
| [options.context.message_id] | `String` | | The message ID to send context with (e.g., for replying to a specific message). |

<a name="send_template"></a>

### sendTemplate(to, name, languageCode, [components], [options])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| to | `String` | | WhatsApp ID or phone number for the person you want to send a message to. |
| name | `String` | | Name of the template. |
| languageCode | `String` | | The code of the language or locale to use. Accepts both language and language_locale formats (e.g., en and en_US). |
| [components] | `Array of Objects` | | See [Official Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#template-object). |
| [options] | `Object` | | |
| [options.context] | `Object` | | Context for the message. |
| [options.context.message_id] | `String` | | The message ID to send context with (e.g., for replying to a specific message). |

<a name="send_contacts"></a>

### sendContacts(to, contacts, [options])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| to | `String` | | WhatsApp ID or phone number for the person you want to send a message to. |
| contacts | `Array of Objects` | | See [Official Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#contacts-object). |
| [options] | `Object` | | |
| [options.context] | `Object` | | Context for the message. |
| [options.context.message_id] | `String` | | The message ID to send context with (e.g., for replying to a specific message). |

<a name="send_reply_buttons"></a>

### sendReplyButtons(to, bodyText, buttons, [options])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| to | `String` | | WhatsApp ID or phone number for the person you want to send a message to. |
| bodyText | `String` | | The content of the message. Emojis and markdown are supported. Maximum length: 1024 characters. |
| buttons | `Object` | | Key-value pair denoting the id and title of the button, i.e. <br /> - **Key**: Unique identifier for your button. This ID is returned in the webhook when the button is clicked by the user. Maximum length: 256 characters. <br /> - **Value**: Button title. It cannot be an empty string and must be unique within the message. Emojis are supported, markdown is not. Maximum length: 20 characters. |
| [options] | `Object` | | |
| [options.footerText] | `String` | | The footer content. Emojis, markdown, and links are supported. Maximum length: 60 characters. |
| [options.header] | `Array of Objects` | | See [Official Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#header-object). |
| [options.context] | `Object` | | Context for the message. |
| [options.context.message_id] | `String` | | The message ID to send context with (e.g., for replying to a specific message). |

<a name="send_list"></a>

### sendList(to, buttonName, bodyText, sections, [options])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| to | `String` | | WhatsApp ID or phone number for the person you want to send a message to. |
| buttonName | `String` | | Button content. It cannot be an empty string and must be unique within the message. Emojis are supported, markdown is not. Maximum length: 20 characters. |
| bodyText | `String` | | The content of the message. Emojis and markdown are supported. Maximum length: 1024 characters. |
| sections | `Object` | | Key-value pair denoting the title of the section and the rows, i.e. <br /> - **Key**: Title of the section. Maximum length: 24 characters. <br /> - **Value**: Contains a list of rows. You can have a total of 10 rows across your sections. Each row must have a title (Maximum length: 24 characters) and an ID (Maximum length: 200 characters). You can add a description (Maximum length: 72 characters), but it is optional. e.g. <br /><br />{<br />"id":"unique-row-identifier-here",<br />"title": "row-title-content-here",<br />"description": "row-description-content-here",<br />} |
| [options] | `Object` | | |
| [options.footerText] | `String` | | The footer content. Emojis, markdown, and links are supported. Maximum length: 60 characters. |
| [options.header] | `Array of Objects` | | See [Official Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#header-object). |
| [options.context] | `Object` | | Context for the message. |
| [options.context.message_id] | `String` | | The message ID to send context with (e.g., for replying to a specific message). |

<a name="send_cta_url"></a>

### sendCTAUrl(to, bodyText, display_text, url, [options])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| to | `String` | | WhatsApp ID or phone number for the person you want to send a message to. |
| bodyText | `String` | | The content of the message. Emojis and markdown are supported. Maximum length: 1024 characters. |
| display_text | `String` | | The display text for the call-to-action button. Maximum length: 20 characters. |
| url | `String` | | The URL to be included in the call-to-action. Must be a valid HTTP/HTTPS URL. |
| [options] | `Object` | | |
| [options.footerText] | `String` | | The footer content. Emojis, markdown, and links are supported. Maximum length: 60 characters. |
| [options.header] | `Array of Objects` | | See [Official Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#header-object). |
| [options.context] | `Object` | | Context for the message. |
| [options.context.message_id] | `String` | | The message ID to send context with (e.g., for replying to a specific message). |

<a name="mark_as_read"></a>

### markAsRead(message_id, status, typing_indicator)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| message_id | `String` | | The ID of the message to mark as read. |
| status | `String` | | The status to set for the message (e.g., "read"). |
| typing_indicator | `Boolean` | | Indicates whether to show a typing indicator. |

<a name="express_module"></a>

## Express Module

`import { getExpressRoute } from '@awadoc/whatsapp-cloud-api/express'`

<a name="get_express_route"></a>

### getExpressRoute(fromPhoneNumberId, [options])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| fromPhoneNumberId | `string` | | Your WhatsApp Business phone number ID. |
| [options] | `Object` | | |
| [options.useMiddleware] | `function` | | A function that accepts middleware for your server. |
| [options.webhookVerifyToken] | `string` | | Verification token for Facebook Developer app settings. |

<a name="next_module"></a>

## Next.js Module

`import { getNextAppRouteHandlers, getNextPagesApiHandler } from '@awadoc/whatsapp-cloud-api/next'`

<a name="get_next_app_route_handlers"></a>

### getNextAppRouteHandlers(fromPhoneNumberId, [options])

For Next.js 13+ App Router (`app/api/.../route.ts`).

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| fromPhoneNumberId | `string` | | Your WhatsApp Business phone number ID. |
| [options] | `Object` | | |
| [options.webhookVerifyToken] | `string` | | Verification token for Facebook Developer app settings. |

Returns an object with `GET` and `POST` handlers.

<a name="get_next_pages_api_handler"></a>

### getNextPagesApiHandler(fromPhoneNumberId, [options])

For Next.js Pages Router (`pages/api/.../ts`).

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| fromPhoneNumberId | `string` | | Your WhatsApp Business phone number ID. |
| [options] | `Object` | | |
| [options.webhookVerifyToken] | `string` | | Verification token for Facebook Developer app settings. |

<a name="on_event"></a>

### on(event, cb: (message) => void)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| event | `string` | | `text` \| `image` \| `document` \| `audio` \| `video` \| `sticker` \| `location` \| `contacts` \| `button_reply` \| `list_reply` |
| message | `object` | | See below. |

`message` object:

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| from | `string` | | WhatsApp ID/phone number of Sender. |
| id | `string` | | ID of created message. |
| timestamp | `string` | | Unix epoch of created message. |
| type | `string` | | `text` \| `image` \| `document` \| `audio` \| `video` \| `sticker` \| `location` \| `contacts` \| `button_reply` \| `list_reply` |
| data | `object` | | Varies depending on the event. e.g., for text, it will be `{ text: string; }` |

## Resources

- [Official WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages)

